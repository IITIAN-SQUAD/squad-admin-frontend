"use client";

import React, { useState } from "react";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import PageWrapper from "@/src/components/page/page-wrapper";
import { ImageUploadManager } from "@/src/components/image-upload-manager";
import { Button } from "@/components/ui/button";
import { Copy, Download, Trash2, ExternalLink, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function MediaLibraryPage() {
  const [copiedText, setCopiedText] = useState<string>("");

  const handleCopyMarkdown = (markdown: string) => {
    navigator.clipboard.writeText(markdown);
    setCopiedText(markdown);
    setTimeout(() => setCopiedText(""), 2000);
  };

  return (
    <>
      <PageHeader title="Media Library" />
      <PageWrapper>
        <div className="space-y-6 overflow-x-hidden max-w-full">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <PageTitle>Image Upload & Management</PageTitle>
              <p className="text-gray-600 mt-2">
                Upload images to AWS S3 and get shortened links for use in questions
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 overflow-x-hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Info className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">How to Use Media Library</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>1. <strong>Upload images</strong> - Click "Upload Image" to select diagrams, charts, or photos</p>
                  <p>2. <strong>Customize</strong> - Set width, height, position, and alt text for accessibility</p>
                  <p>3. <strong>Get markdown</strong> - Copy the generated markdown and paste into question editor</p>
                  <p>4. <strong>Manage</strong> - View all uploaded images in the gallery below</p>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200 overflow-x-hidden">
                  <p className="text-xs font-medium text-blue-900 mb-2">📝 Markdown Syntax Guide:</p>
                  <div className="space-y-1 text-xs text-blue-800 font-mono overflow-x-auto">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-blue-600">•</span>
                      <code className="bg-blue-50 px-2 py-1 rounded break-all">![alt](url)</code>
                      <span className="text-gray-600">- Basic image</span>
                    </div>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-blue-600">•</span>
                      <code className="bg-blue-50 px-2 py-1 rounded break-all">![alt](url){`{width=300px}`}</code>
                      <span className="text-gray-600">- With width</span>
                    </div>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-blue-600">•</span>
                      <code className="bg-blue-50 px-2 py-1 rounded break-all">![alt](url){`{position=center}`}</code>
                      <span className="text-gray-600">- With position</span>
                    </div>
                    <div className="flex items-start gap-2 flex-wrap">
                      <span className="text-blue-600">•</span>
                      <code className="bg-blue-50 px-2 py-1 rounded break-all">![alt](url){`{width=500px height=400px position=center}`}</code>
                      <span className="text-gray-600">- Full control</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Image Upload Manager */}
          <ImageUploadManager 
            onInsertImage={(markdown) => {
              handleCopyMarkdown(markdown);
            }}
          />

          {/* Quick Actions */}
          <Card className="p-6 overflow-x-hidden">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-hidden">
              <div className="p-4 border rounded-lg hover:border-yellow-400 transition-colors">
                <Copy className="w-8 h-8 text-yellow-600 mb-2" />
                <h4 className="font-medium mb-1">Copy Markdown</h4>
                <p className="text-sm text-gray-600">
                  Select an image from the gallery above and copy its markdown
                </p>
              </div>
              
              <div className="p-4 border rounded-lg hover:border-yellow-400 transition-colors">
                <ExternalLink className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium mb-1">Get Short URL</h4>
                <p className="text-sm text-gray-600">
                  All uploaded images get a shortened URL automatically
                </p>
              </div>
              
              <div className="p-4 border rounded-lg hover:border-yellow-400 transition-colors">
                <Download className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium mb-1">S3 Integration</h4>
                <p className="text-sm text-gray-600">
                  Images are uploaded to AWS S3 with CDN delivery
                </p>
              </div>
            </div>
          </Card>

          {/* Usage Tips */}
          <Card className="p-6 bg-yellow-50 border-yellow-200 overflow-x-hidden">
            <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              💡 Pro Tips
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span><strong>For diagrams:</strong> Use 400-600px width for best visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span><strong>For icons:</strong> Use 100-150px width with position=left or right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span><strong>For full-width images:</strong> Use width=100% with position=center</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span><strong>For responsive images:</strong> Use percentage widths (e.g., width=50%)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span><strong>Alt text matters:</strong> Always add descriptive alt text for accessibility</span>
              </li>
            </ul>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
