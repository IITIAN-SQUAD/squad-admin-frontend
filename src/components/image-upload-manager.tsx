"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Upload, 
  X, 
  Copy, 
  Check, 
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { s3UploadService } from '@/src/services/s3-upload.service';
import { imageCacheService } from '@/src/services/image-cache.service';

interface UploadedImage {
  id: string;
  url: string;
  shortUrl: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
}

interface ImageUploadManagerProps {
  onInsertImage?: (markdown: string) => void;
}

export function ImageUploadManager({ onInsertImage }: ImageUploadManagerProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image customization states
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [imageWidth, setImageWidth] = useState<string>("");
  const [imageHeight, setImageHeight] = useState<string>("");
  const [imagePosition, setImagePosition] = useState<string>("center");
  const [altText, setAltText] = useState<string>("");

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const file = files[0];
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB');
      }

      // In production, upload to S3
      const uploadedImage = await uploadToS3(file);
      
      setImages(prev => [uploadedImage, ...prev]);
      setSelectedImage(uploadedImage);
      setAltText(file.name.split('.')[0]);
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const uploadToS3 = async (file: File): Promise<UploadedImage> => {
    // Real S3 upload using service
    const result = await s3UploadService.uploadFile(file, 'questions');
    
    // Preload image into cache immediately after upload
    try {
      await imageCacheService.getImage(result.url);
      console.log('[Upload] Image cached:', result.url);
    } catch (err) {
      console.warn('[Upload] Failed to cache image:', err);
    }
    
    return {
      id: result.key.split('/').pop() || generateShortId(),
      url: result.url,
      shortUrl: result.url,
      fileName: result.fileName,
      size: result.size,
      uploadedAt: new Date()
    };
  };

  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const generateMarkdown = (image: UploadedImage) => {
    let markdown = `![${altText || image.fileName}](${image.shortUrl})`;
    
    const attrs: string[] = [];
    if (imageWidth) attrs.push(`width=${imageWidth}`);
    if (imageHeight) attrs.push(`height=${imageHeight}`);
    if (imagePosition && imagePosition !== 'center') attrs.push(`position=${imagePosition}`);
    
    if (attrs.length > 0) {
      markdown += `{${attrs.join(' ')}}`;
    }
    
    return markdown;
  };

  const copyToClipboard = async (text: string, imageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(imageId);
      setTimeout(() => setCopiedId(""), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInsert = () => {
    if (selectedImage && onInsertImage) {
      const markdown = generateMarkdown(selectedImage);
      onInsertImage(markdown);
      
      // Reset customization
      setImageWidth("");
      setImageHeight("");
      setImagePosition("center");
      setAltText("");
      setSelectedImage(null);
    }
  };

  const deleteImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4 overflow-x-hidden max-w-full image-upload-manager">
      {/* Upload Section */}
      <Card className="p-6 overflow-x-hidden">
        <div className="space-y-4 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Image Upload Manager
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Upload images to S3 and get shortened links
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Image
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg overflow-x-hidden">
            <p className="font-medium text-blue-900 mb-1">📝 Markdown Syntax Examples:</p>
            <ul className="space-y-1 ml-4 overflow-x-auto">
              <li className="break-all">• Basic: <code className="bg-blue-100 px-1 rounded">![alt](url)</code></li>
              <li className="break-all">• With width: <code className="bg-blue-100 px-1 rounded">![alt](url){'{width=300px}'}</code></li>
              <li className="break-all">• With position: <code className="bg-blue-100 px-1 rounded">![alt](url){'{position=left}'}</code></li>
              <li className="break-all">• Full: <code className="bg-blue-100 px-1 rounded">![alt](url){'{width=400px height=300px position=center}'}</code></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Image Customization */}
      {selectedImage && (
        <Card className="p-6 border-2 border-yellow-400 bg-yellow-50 overflow-x-hidden">
          <div className="space-y-4 overflow-x-hidden break-words">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-yellow-900">Customize Selected Image</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedImage(null)}
              >
                Cancel
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Image description"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Select value={imagePosition} onValueChange={setImagePosition}>
                  <SelectTrigger id="position" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="left">Left (Float)</SelectItem>
                    <SelectItem value="right">Right (Float)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="width">Width (optional)</Label>
                <Input
                  id="width"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  placeholder="e.g., 300px, 50%, auto"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (optional)</Label>
                <Input
                  id="height"
                  value={imageHeight}
                  onChange={(e) => setImageHeight(e.target.value)}
                  placeholder="e.g., 200px, auto"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded border">
              <Label className="text-sm font-medium">Generated Markdown:</Label>
              <code className="block mt-2 p-2 bg-gray-50 rounded text-sm font-mono">
                {generateMarkdown(selectedImage)}
              </code>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleInsert} className="flex-1">
                Insert into Editor
              </Button>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(generateMarkdown(selectedImage), selectedImage.id)}
              >
                {copiedId === selectedImage.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Uploaded Images Gallery */}
      {images.length > 0 && (
        <Card className="p-6 overflow-x-hidden">
          <h4 className="font-semibold mb-4">Uploaded Images ({images.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-x-hidden">
            {images.map((image) => (
              <div
                key={image.id}
                className={`relative group border rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImage?.id === image.id
                    ? 'border-yellow-500 ring-2 ring-yellow-400'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => {
                  setSelectedImage(image);
                  setAltText(image.fileName.split('.')[0]);
                }}
              >
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 bg-white">
                  <p className="text-xs font-medium truncate">{image.fileName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(image.size)}</p>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(image.shortUrl, image.id);
                    }}
                  >
                    {copiedId === image.id ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(image.id);
                    }}
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
