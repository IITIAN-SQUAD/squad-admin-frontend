/**
 * PDF Image Extractor Service
 * Extracts images from PDF pages using PDF.js and Canvas API
 * Integrates with Vision LLM to identify image regions
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface ImageRegion {
  pageNumber: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  purpose: 'question' | 'hint' | 'solution' | 'option';
  suggestedWidth?: string;
  suggestedHeight?: string;
  position?: 'left' | 'center' | 'right';
  altText?: string;
  questionIndex?: number; // Which question this image belongs to
}

export interface ExtractedImage {
  blob: Blob;
  dataUrl: string;
  region: ImageRegion;
  fileName: string;
}

export interface PDFPageImage {
  pageNumber: number;
  imageDataUrl: string;
  width: number;
  height: number;
}

export class PDFImageExtractorService {
  private static instance: PDFImageExtractorService;

  private constructor() {}

  static getInstance(): PDFImageExtractorService {
    if (!PDFImageExtractorService.instance) {
      PDFImageExtractorService.instance = new PDFImageExtractorService();
    }
    return PDFImageExtractorService.instance;
  }

  /**
   * Convert PDF or Image to images (one per page for PDF, single image for image files)
   */
  async convertPDFToImages(
    fileBase64: string,
    scale: number = 3.0 // Higher scale = better quality (increased from 2.0 to 3.0)
  ): Promise<PDFPageImage[]> {
    try {
      // Check if it's an image file (not PDF)
      const isImage = /^data:image\//.test(fileBase64);
      
      if (isImage) {
        // Handle image files directly
        console.log('Detected image file, processing as single page');
        return await this.convertImageToPageImage(fileBase64);
      }
      
      // Handle PDF files
      // Remove data URI prefix if present and clean the base64 string
      let base64Data = fileBase64.replace(/^data:application\/pdf;base64,/, '');
      
      // Remove any whitespace, newlines, or invalid characters
      base64Data = base64Data.replace(/[\s\n\r]/g, '');
      
      // Validate base64 string
      if (!base64Data || base64Data.length === 0) {
        throw new Error('Empty or invalid base64 data');
      }
      
      // Try to decode base64 - if it fails, the data might already be binary
      let pdfData: Uint8Array;
      try {
        pdfData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      } catch (decodeError) {
        console.error('Base64 decode error, trying alternative method:', decodeError);
        // If atob fails, try treating it as already decoded or use alternative method
        throw new Error('Invalid base64 encoding. Please ensure the file is properly base64 encoded.');
      }
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      const pageImages: PDFPageImage[] = [];
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/png');
        
        pageImages.push({
          pageNumber: pageNum,
          imageDataUrl,
          width: viewport.width,
          height: viewport.height,
        });
      }
      
      return pageImages;
    } catch (error) {
      console.error('PDF to images conversion error:', error);
      throw new Error(`Failed to convert PDF to images: ${error}`);
    }
  }

  /**
   * Convert image file (JPG/PNG) to PDFPageImage format
   */
  private async convertImageToPageImage(imageDataUrl: string): Promise<PDFPageImage[]> {
    try {
      // Load the image to get dimensions
      const img = await this.loadImage(imageDataUrl);
      
      return [{
        pageNumber: 1,
        imageDataUrl: imageDataUrl,
        width: img.width,
        height: img.height,
      }];
    } catch (error) {
      console.error('Image conversion error:', error);
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  /**
   * Crop specific regions from page images
   */
  async cropImageRegions(
    pageImages: PDFPageImage[],
    regions: ImageRegion[]
  ): Promise<ExtractedImage[]> {
    const extractedImages: ExtractedImage[] = [];
    
    for (const region of regions) {
      try {
        // Find the corresponding page image
        const pageImage = pageImages.find(img => img.pageNumber === region.pageNumber);
        if (!pageImage) {
          console.warn(`Page ${region.pageNumber} not found for region`);
          continue;
        }
        
        // Create image element from data URL
        const img = await this.loadImage(pageImage.imageDataUrl);
        
        console.log('🖼️ Image Extraction Debug:', {
          pageNumber: region.pageNumber,
          actualImageSize: { width: img.width, height: img.height },
          llmBoundingBox: region.boundingBox,
          questionIndex: region.questionIndex
        });
        
        // Validate LLM coordinates - check if they're within image bounds
        const isValidCoordinates = 
          region.boundingBox.x >= 0 &&
          region.boundingBox.y >= 0 &&
          region.boundingBox.x < img.width &&
          region.boundingBox.y < img.height &&
          (region.boundingBox.x + region.boundingBox.width) <= img.width &&
          (region.boundingBox.y + region.boundingBox.height) <= img.height;
        
        let paddedBox;
        
        if (!isValidCoordinates) {
          console.warn('⚠️ Invalid LLM coordinates detected! Falling back to full image.', {
            llmBox: region.boundingBox,
            imageSize: { width: img.width, height: img.height },
            reason: region.boundingBox.y >= img.height 
              ? `y coordinate (${region.boundingBox.y}) exceeds image height (${img.height})`
              : region.boundingBox.x >= img.width
              ? `x coordinate (${region.boundingBox.x}) exceeds image width (${img.width})`
              : 'Bounding box extends beyond image boundaries'
          });
          
          // Fallback: Use the entire image
          paddedBox = {
            x: 0,
            y: 0,
            width: img.width,
            height: img.height
          };
          
          console.log('✅ Using full image as fallback for manual cropping later');
        } else {
          // Valid coordinates - use them with padding
          paddedBox = {
            x: Math.max(0, region.boundingBox.x - 3),
            y: Math.max(0, region.boundingBox.y - 3),
            width: Math.min(
              img.width - (region.boundingBox.x - 3),
              region.boundingBox.width + 6
            ),
            height: Math.min(
              img.height - (region.boundingBox.y - 3),
              region.boundingBox.height + 6
            )
          };
          
          console.log('✅ Valid coordinates - using LLM bounding box with padding');
        }
        
        console.log('📦 Final Extraction Box:', paddedBox);
        
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        // Set canvas size to padded region
        canvas.width = paddedBox.width;
        canvas.height = paddedBox.height;
        
        // Draw cropped region with padding
        ctx.drawImage(
          img,
          paddedBox.x,
          paddedBox.y,
          paddedBox.width,
          paddedBox.height,
          0,
          0,
          paddedBox.width,
          paddedBox.height
        );
        
        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create blob'));
            },
            'image/png',
            1.0 // Quality (maximum quality)
          );
        });
        
        // Generate unique filename with timestamp and random component
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8); // 6 random chars
        const fileName = `img_p${region.pageNumber}_q${region.questionIndex || 0}_${region.purpose}_${timestamp}_${random}.png`;
        
        extractedImages.push({
          blob,
          dataUrl: canvas.toDataURL('image/png'),
          region,
          fileName,
        });
      } catch (error) {
        console.error(`Failed to crop region on page ${region.pageNumber}:`, error);
      }
    }
    
    return extractedImages;
  }


  /**
   * Optimize image (resize and compress)
   */
  async optimizeImage(
    blob: Blob,
    maxWidth: number = 1200,
    maxHeight: number = 1200,
    quality: number = 0.85
  ): Promise<Blob> {
    try {
      const img = await this.loadImage(URL.createObjectURL(blob));
      
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      // Create canvas for resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/png',
          quality
        );
      });
    } catch (error) {
      console.error('Image optimization error:', error);
      return blob; // Return original if optimization fails
    }
  }

  /**
   * Helper: Load image from data URL
   */
  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }


  /**
   * Generate markdown for image with metadata
   */
  generateMarkdown(
    s3Url: string,
    region: ImageRegion
  ): string {
    const altText = region.altText || `${region.purpose} image`;
    const attributes: string[] = [];
    
    if (region.suggestedWidth) {
      attributes.push(`width=${region.suggestedWidth}`);
    } else {
      attributes.push('width=450px');
    }
    if (region.suggestedHeight) {
      attributes.push(`height=${region.suggestedHeight}`);
    }
    if (region.position) {
      attributes.push(`position=${region.position}`);
    }
    
    const attrString = attributes.length > 0 ? `{${attributes.join(' ')}}` : '';
    return `![${altText}](${s3Url})${attrString}`;
  }
}

export const pdfImageExtractor = PDFImageExtractorService.getInstance();
