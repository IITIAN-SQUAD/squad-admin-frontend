import { MediaAsset } from '@/src/types/exam';

export interface UploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export interface UploadResult {
  success: boolean;
  asset?: MediaAsset;
  error?: string;
}

const DEFAULT_OPTIONS: UploadOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
  generateThumbnail: true
};

export class FileUploadService {
  private static instance: FileUploadService;
  private uploadEndpoint: string;

  constructor(uploadEndpoint: string = '/api/upload') {
    this.uploadEndpoint = uploadEndpoint;
  }

  static getInstance(uploadEndpoint?: string): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService(uploadEndpoint);
    }
    return FileUploadService.instance;
  }

  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Validate file
    const validation = this.validateFile(file, opts);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // In production, this would upload to your backend/CDN
      // For now, we'll simulate the upload and create a mock asset
      const asset = await this.mockUpload(file, opts);
      
      return { success: true, asset };
    } catch (error) {
      console.error('Upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  private validateFile(file: File, options: UploadOptions): { valid: boolean; error?: string } {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(options.maxSize)})`
      };
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  private async mockUpload(file: File, options: UploadOptions): Promise<MediaAsset> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const fileId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fileName = `${fileId}_${file.name}`;
    
    // Create data URL for preview (in production, this would be the actual uploaded URL)
    const dataUrl = await this.fileToDataUrl(file);
    
    let thumbnailUrl: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

    // Generate thumbnail for images
    if (file.type.startsWith('image/') && options.generateThumbnail) {
      const imageInfo = await this.getImageInfo(file);
      width = imageInfo.width;
      height = imageInfo.height;
      thumbnailUrl = await this.generateThumbnail(file, 200, 200);
    }

    const asset: MediaAsset = {
      id: fileId,
      type: this.getAssetType(file.type),
      originalName: file.name,
      fileName,
      mimeType: file.type,
      size: file.size,
      url: dataUrl, // In production: actual CDN URL
      thumbnailUrl,
      width,
      height,
      createdAt: new Date()
    };

    return asset;
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async getImageInfo(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private async generateThumbnail(file: File, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate thumbnail dimensions
        const { width, height } = this.calculateThumbnailSize(
          img.naturalWidth, 
          img.naturalHeight, 
          maxWidth, 
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Could not generate thumbnail'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateThumbnailSize(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxHeight;

    if (aspectRatio > 1) {
      // Landscape
      height = width / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Portrait or square
      width = height * aspectRatio;
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  private getAssetType(mimeType: string): MediaAsset['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility method for batch uploads
  async uploadMultipleFiles(
    files: File[], 
    options: UploadOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], options);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const fileUploadService = FileUploadService.getInstance();

// Utility functions
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith('video/');
};

export const isAudioFile = (file: File): boolean => {
  return file.type.startsWith('audio/');
};

export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};
