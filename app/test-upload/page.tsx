"use client";

import { useState } from 'react';
import { ImageUpload } from '@/src/components/image-upload';
import { ImageUploadManager } from '@/src/components/image-upload-manager';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageWrapper from '@/src/components/page/page-wrapper';
import PageHeader from '@/src/components/page/page-header';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function TestUploadPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleUploadComplete = (url: string, result: any) => {
    setUploadedUrls(prev => [...prev, url]);
    console.log('Upload complete:', result);
  };

  const handleUploadError = (error: string) => {
    setErrors(prev => [...prev, error]);
    console.error('Upload error:', error);
  };

  const handleInsertImage = (markdown: string) => {
    console.log('Insert markdown:', markdown);
    alert(`Markdown copied to clipboard:\n${markdown}`);
    navigator.clipboard.writeText(markdown);
  };

  return (
    <>
      <PageHeader title="Test S3 Image Upload" />
      <PageWrapper>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Test S3 Image Upload</h1>
            <p className="text-gray-600 mt-2">
              Test AWS S3 image upload functionality with different components
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Successful Uploads</p>
                  <p className="text-2xl font-bold text-green-900">{uploadedUrls.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-600" />
                <div>
                  <p className="text-sm text-red-700 font-medium">Failed Uploads</p>
                  <p className="text-2xl font-bold text-red-900">{errors.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs for different components */}
          <Tabs defaultValue="simple" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simple">Simple Upload</TabsTrigger>
              <TabsTrigger value="manager">Upload Manager</TabsTrigger>
            </TabsList>

            <TabsContent value="simple" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Simple Image Upload Component</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Basic upload with preview and progress tracking
                </p>
                
                <ImageUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  folder="test-uploads"
                  maxSizeMB={10}
                />
              </Card>
            </TabsContent>

            <TabsContent value="manager" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Advanced Upload Manager</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Full-featured manager with markdown generation and customization
                </p>
                
                <ImageUploadManager onInsertImage={handleInsertImage} />
              </Card>
            </TabsContent>
          </Tabs>

          {/* Uploaded URLs */}
          {uploadedUrls.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Uploaded Image URLs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadedUrls.map((url, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">Upload #{index + 1}</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="text-lg font-semibold mb-4 text-red-900">Upload Errors</h3>
              <div className="space-y-2">
                {errors.map((error, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Setup Instructions */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">📝 Setup Instructions</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Install: <code className="bg-blue-100 px-2 py-0.5 rounded">npm install @aws-sdk/client-s3</code></span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Add AWS credentials to <code className="bg-blue-100 px-2 py-0.5 rounded">.env.local</code></span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Create S3 bucket and configure permissions</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>See <code className="bg-blue-100 px-2 py-0.5 rounded">S3_SETUP_GUIDE.md</code> for details</span>
              </li>
            </ol>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
