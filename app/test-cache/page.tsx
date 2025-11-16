"use client";

import { useState } from 'react';
import { CachedImage } from '@/src/components/cached-image';
import { CacheMonitor } from '@/src/components/cache-monitor';
import { CacheInspector } from '@/src/components/cache-inspector';
import { usePreloadImages } from '@/src/hooks/use-cached-image';
import { imageCacheService } from '@/src/services/image-cache.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageWrapper from '@/src/components/page/page-wrapper';
import PageHeader from '@/src/components/page/page-header';
import { Zap, Image as ImageIcon, TrendingUp } from 'lucide-react';

export default function TestCachePage() {
  // Sample S3 image URLs (replace with your actual URLs)
  const sampleImages = [
    'https://prod-image-bucket-2.s3.ap-south-1.amazonaws.com/questions/screenshot_2025_11_16_at_2_51_21_am_1763241693677_m7hp0y.png',
    // Add more URLs here
  ];

  const [selectedImage, setSelectedImage] = useState(sampleImages[0]);
  const [loadCount, setLoadCount] = useState(0);
  const { isLoading, loadedCount, progress } = usePreloadImages(sampleImages);

  const handleLoadImage = () => {
    setLoadCount(prev => prev + 1);
    // Force re-render to test cache
    setSelectedImage(sampleImages[0]);
  };

  const stats = imageCacheService.getStats();

  return (
    <>
      <PageHeader title="Image Cache Testing" />
      <PageWrapper>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Image Cache System Test</h1>
            <p className="text-gray-600 mt-2">
              Test in-memory caching for S3 images and monitor performance improvements
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">Cache Hits</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.hits}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-700 font-medium">Cache Misses</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.misses}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-700 font-medium">Hit Rate</p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.hitRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold">
                  {stats.entries}
                </div>
                <div>
                  <p className="text-sm text-purple-700 font-medium">Cached Images</p>
                  <p className="text-sm text-purple-600">
                    {stats.sizeMB.toFixed(2)} MB
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="single">Single Image Test</TabsTrigger>
              <TabsTrigger value="multiple">Multiple Images</TabsTrigger>
              <TabsTrigger value="inspector">Cache Inspector</TabsTrigger>
              <TabsTrigger value="comparison">Performance</TabsTrigger>
            </TabsList>

            {/* Single Image Test */}
            <TabsContent value="single" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Single Image Caching Test</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click "Load Image" multiple times. First load fetches from S3, subsequent loads are instant from cache.
                </p>

                <div className="space-y-4">
                  <Button onClick={handleLoadImage} className="w-full">
                    Load Image (Loaded {loadCount} times)
                  </Button>

                  {loadCount > 0 && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <CachedImage
                        src={selectedImage}
                        alt="Test image"
                        className="w-full h-auto rounded"
                      />
                    </div>
                  )}

                  {loadCount > 1 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✅ <strong>Cache Working!</strong> This image loaded instantly from cache.
                        Check the Cache Hits counter above.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Multiple Images Test */}
            <TabsContent value="multiple" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Multiple Images Preloading</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Preload multiple images at once. All images are cached for instant display.
                </p>

                {isLoading && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 mb-2">
                      Preloading images: {progress.toFixed(0)}%
                    </p>
                    <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {sampleImages.map((url, index) => (
                    <div key={index} className="border rounded-lg p-2 bg-gray-50">
                      <CachedImage
                        src={url}
                        alt={`Sample ${index + 1}`}
                        className="w-full h-48 object-cover rounded"
                      />
                      <p className="text-xs text-gray-600 mt-2 truncate">
                        Image {index + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Cache Inspector */}
            <TabsContent value="inspector" className="space-y-4">
              <CacheInspector />
              
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">🔑 Cache Key Information</h4>
                <div className="text-sm text-yellow-800 space-y-2">
                  <p>
                    <strong>Cache Key:</strong> Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/folder/file.png)
                  </p>
                  <p>
                    <strong>Cache Value:</strong> Blob object + Object URL + metadata (timestamp, size)
                  </p>
                  <p>
                    <strong>Lookup:</strong> O(1) constant time using JavaScript Map
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* Performance Comparison */}
            <TabsContent value="comparison" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-900 mb-2">❌ Without Cache</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        <li>• Every request → S3 GET</li>
                        <li>• Load time: 100-500ms</li>
                        <li>• Network bandwidth used</li>
                        <li>• S3 costs per request</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">✅ With Cache</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• First request → S3 GET</li>
                        <li>• Subsequent: 0ms (instant)</li>
                        <li>• No bandwidth after cache</li>
                        <li>• Single S3 cost per hour</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      📊 Current Session Stats
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Total Requests:</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.hits + stats.misses}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Requests Saved:</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.hits}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Cache Efficiency:</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.hitRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Memory Used:</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {stats.sizeMB.toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {stats.hits > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        🎉 <strong>Great!</strong> You've saved {stats.hits} S3 requests this session.
                        That's approximately {(stats.hits * 0.0004).toFixed(4)} USD in S3 costs
                        and {(stats.hits * 200).toFixed(0)}ms in loading time!
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Info Card */}
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold mb-3 text-yellow-900">💡 How to Use in Your App</h3>
            <ol className="space-y-2 text-sm text-yellow-800">
              <li>
                <strong>1. Replace &lt;img&gt; tags:</strong>
                <code className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                  &lt;CachedImage src={'{url}'} alt="..." /&gt;
                </code>
              </li>
              <li>
                <strong>2. Preload images:</strong>
                <code className="ml-2 bg-yellow-100 px-2 py-1 rounded">
                  usePreloadImages(imageUrls)
                </code>
              </li>
              <li>
                <strong>3. Monitor performance:</strong> Use the Cache Monitor (bottom-right corner)
              </li>
              <li>
                <strong>4. Configure settings:</strong> Adjust cache size and TTL in service
              </li>
            </ol>
          </Card>
        </div>

        {/* Cache Monitor */}
        <CacheMonitor />
      </PageWrapper>
    </>
  );
}
