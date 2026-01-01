/**
 * Image Processing Orchestrator
 * Coordinates the entire image extraction and upload pipeline
 */

import { pdfImageExtractor, ImageRegion, ExtractedImage, PDFPageImage } from './pdf-image-extractor.service';
import { aiService } from './ai.service';
import { s3UploadService } from './s3-upload.service';

export interface ProcessedImage {
  s3Url: string;
  region: ImageRegion;
  markdown: string;
  fileName: string;
}

export interface ImageProcessingResult {
  processedImages: ProcessedImage[];
  pageImages: PDFPageImage[];
  totalImages: number;
  processingTime: number;
}

export interface ImageProcessingProgress {
  stage: 'converting' | 'analyzing' | 'cropping' | 'uploading' | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
  percentage: number;
}

export class ImageProcessingOrchestrator {
  private static instance: ImageProcessingOrchestrator;

  private constructor() {}

  static getInstance(): ImageProcessingOrchestrator {
    if (!ImageProcessingOrchestrator.instance) {
      ImageProcessingOrchestrator.instance = new ImageProcessingOrchestrator();
    }
    return ImageProcessingOrchestrator.instance;
  }

  /**
   * Main orchestration method - processes PDF/Image and extracts diagrams to S3
   */
  async processImagesFromPDF(
    questionFileBase64: string,
    solutionFileBase64?: string,
    onProgress?: (progress: ImageProcessingProgress) => void
  ): Promise<ImageProcessingResult> {
    const startTime = Date.now();
    let totalSteps = 4; // converting, analyzing, cropping, uploading
    let currentStep = 0;

    try {
      // Detect file type
      const isQuestionImage = /^data:image\//.test(questionFileBase64);
      const fileType = isQuestionImage ? 'image' : 'PDF';
      
      // Step 1: Convert PDF/Image to processable format
      currentStep++;
      onProgress?.({
        stage: 'converting',
        currentStep,
        totalSteps,
        message: `Processing ${fileType} file...`,
        percentage: (currentStep / totalSteps) * 100
      });

      const questionPages = await pdfImageExtractor.convertPDFToImages(questionFileBase64, 2.0);
      let solutionPages: PDFPageImage[] = [];
      
      if (solutionFileBase64) {
        solutionPages = await pdfImageExtractor.convertPDFToImages(solutionFileBase64, 2.0);
      }

      const allPages = [
        ...questionPages.map(p => ({ ...p, source: 'question' as const })),
        ...solutionPages.map(p => ({ 
          ...p, 
          pageNumber: p.pageNumber + questionPages.length, // Offset page numbers
          source: 'solution' as const 
        }))
      ];

      console.log(`Converted ${allPages.length} pages to images`);

      // Step 2: Analyze images with Vision LLM to identify regions
      // Check if image extraction is enabled via environment variable
      const enableImageExtraction = process.env.NEXT_PUBLIC_ENABLE_IMAGE_EXTRACTION === 'true';
      
      if (!enableImageExtraction) {
        console.log('⚠️ Image extraction is disabled via NEXT_PUBLIC_ENABLE_IMAGE_EXTRACTION flag');
        console.log('💡 Images can be manually added via markdown in the question editor');
        return {
          processedImages: [],
          pageImages: questionPages,
          totalImages: 0,
          processingTime: Date.now() - startTime
        };
      }

      currentStep++;
      onProgress?.({
        stage: 'analyzing',
        currentStep,
        totalSteps,
        message: 'Analyzing pages to identify diagrams and images...',
        percentage: (currentStep / totalSteps) * 100
      });

      const pageImagesForAnalysis = allPages.map(p => ({
        pageNumber: p.pageNumber,
        imageDataUrl: p.imageDataUrl
      }));

      const imageRegions = await aiService.identifyImageRegions(pageImagesForAnalysis);
      
      if (imageRegions.length === 0) {
        console.log('No images identified in the PDF');
        return {
          processedImages: [],
          pageImages: questionPages,
          totalImages: 0,
          processingTime: Date.now() - startTime
        };
      }

      console.log(`Identified ${imageRegions.length} image regions`);

      // Step 3: Crop images based on identified regions
      currentStep++;
      onProgress?.({
        stage: 'cropping',
        currentStep,
        totalSteps,
        message: `Cropping ${imageRegions.length} images...`,
        percentage: (currentStep / totalSteps) * 100
      });

      const extractedImages = await pdfImageExtractor.cropImageRegions(
        allPages,
        imageRegions
      );

      console.log(`Cropped ${extractedImages.length} images`);

      // Step 4: Upload to S3 and generate markdown
      currentStep++;
      onProgress?.({
        stage: 'uploading',
        currentStep,
        totalSteps,
        message: `Uploading ${extractedImages.length} images to S3...`,
        percentage: (currentStep / totalSteps) * 100
      });

      const processedImages: ProcessedImage[] = [];

      for (let i = 0; i < extractedImages.length; i++) {
        const extracted = extractedImages[i];
        
        // Update progress for each upload
        onProgress?.({
          stage: 'uploading',
          currentStep,
          totalSteps,
          message: `Uploading image ${i + 1} of ${extractedImages.length}...`,
          percentage: ((currentStep - 1) / totalSteps + (i / extractedImages.length) / totalSteps) * 100
        });

        try {
          // Optimize image before upload
          const optimizedBlob = await pdfImageExtractor.optimizeImage(
            extracted.blob,
            2400, // max width (increased from 1200)
            2400, // max height (increased from 1200)
            0.95  // quality (increased from 0.85)
          );

          // Convert blob to File for S3 upload
          const file = new File([optimizedBlob], extracted.fileName, { type: 'image/png' });

          // Upload to S3
          const uploadResult = await s3UploadService.uploadFile(
            file,
            'questions/diagrams'
          );

          // Generate markdown
          const markdown = pdfImageExtractor.generateMarkdown(
            uploadResult.url,
            extracted.region
          );

          processedImages.push({
            s3Url: uploadResult.url,
            region: extracted.region,
            markdown,
            fileName: extracted.fileName
          });

          console.log(`Uploaded: ${extracted.fileName} → ${uploadResult.url}`);
        } catch (error) {
          console.error(`Failed to upload ${extracted.fileName}:`, error);
          // Continue with other images even if one fails
        }
      }

      // Complete
      onProgress?.({
        stage: 'complete',
        currentStep: totalSteps,
        totalSteps,
        message: `Successfully processed ${processedImages.length} images`,
        percentage: 100
      });

      const processingTime = Date.now() - startTime;
      console.log(`Image processing complete in ${processingTime}ms`);

      return {
        processedImages,
        pageImages: questionPages,
        totalImages: processedImages.length,
        processingTime
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Image processing failed: ${error}`);
    }
  }

  /**
   * Helper: Group processed images by question index
   */
  groupImagesByQuestion(processedImages: ProcessedImage[]): Map<number, ProcessedImage[]> {
    const grouped = new Map<number, ProcessedImage[]>();
    
    for (const img of processedImages) {
      const questionIndex = img.region.questionIndex || 0;
      if (!grouped.has(questionIndex)) {
        grouped.set(questionIndex, []);
      }
      grouped.get(questionIndex)!.push(img);
    }
    
    return grouped;
  }

  /**
   * Helper: Insert images into question text at appropriate locations
   */
  insertImagesIntoQuestionText(
    questionText: string,
    images: ProcessedImage[],
    purpose: 'question' | 'hint' | 'solution'
  ): string {
    const relevantImages = images.filter(img => img.region.purpose === purpose);
    
    if (relevantImages.length === 0) {
      return questionText;
    }

    // For now, append images at the end with proper spacing
    // In future, could use more sophisticated positioning
    const imageMarkdowns = relevantImages.map(img => img.markdown).join('\n\n');
    return `${questionText}\n\n${imageMarkdowns}`;
  }
}

export const imageProcessingOrchestrator = ImageProcessingOrchestrator.getInstance();
