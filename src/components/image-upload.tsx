"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { s3UploadService, UploadResult, UploadProgress } from '@/src/services/s3-upload.service';

interface ImageUploadProps {
  onUploadComplete: (url: string, result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  folder?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
}

export function ImageUpload({
  onUploadComplete,
  onUploadError,
  folder = 'questions',
  maxSizeMB = 10,
  multiple = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validate file
    const validation = s3UploadService.validateFile(file, maxSizeMB);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      onUploadError?.(validation.error || 'Invalid file');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to S3
    try {
      setUploading(true);
      setProgress(0);

      const result = await s3UploadService.uploadFile(
        file,
        folder,
        (uploadProgress: UploadProgress) => {
          setProgress(uploadProgress.percentage);
        }
      );

      setUploadedUrl(result.url);
      onUploadComplete(result.url, result);
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed';
      setError(errorMsg);
      onUploadError?.(errorMsg);
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        disabled={uploading}
      />

      {!preview && !uploadedUrl && (
        <Card
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 hover:border-yellow-500 transition-colors cursor-pointer p-8 text-center"
        >
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            Click to upload image
          </p>
          <p className="text-xs text-gray-500">
            JPEG, PNG, GIF, WebP (max {maxSizeMB}MB)
          </p>
        </Card>
      )}

      {preview && (
        <Card className="p-4 relative">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
            
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm font-medium">{progress}%</p>
                  <div className="w-48 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {uploadedUrl && !uploading && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                <Check className="w-4 h-4" />
              </div>
            )}

            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 left-2"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {uploadedUrl && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs break-all">
              <p className="font-semibold text-gray-700 mb-1">URL:</p>
              <p className="text-gray-600">{uploadedUrl}</p>
            </div>
          )}
        </Card>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
