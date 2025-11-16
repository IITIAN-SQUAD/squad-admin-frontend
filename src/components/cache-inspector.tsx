"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { imageCacheService } from '@/src/services/image-cache.service';
import { Database, RefreshCw, Eye, Copy, Check } from 'lucide-react';

export function CacheInspector() {
  const [cacheEntries, setCacheEntries] = useState<Array<{ key: string; size: number; timestamp: Date }>>([]);
  const [copiedKey, setCopiedKey] = useState<string>('');

  const loadCacheEntries = () => {
    // Access cache entries (note: this is for debugging only)
    const entries: Array<{ key: string; size: number; timestamp: Date }> = [];
    
    // @ts-ignore - Accessing private property for debugging
    const cache = imageCacheService.cache;
    
    if (cache) {
      cache.forEach((value: any, key: string) => {
        entries.push({
          key,
          size: value.size,
          timestamp: new Date(value.timestamp),
        });
      });
    }
    
    setCacheEntries(entries);
  };

  useEffect(() => {
    loadCacheEntries();
    
    // Refresh every 2 seconds
    const interval = setInterval(loadCacheEntries, 2000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  const getShortUrl = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Cache Inspector
        </h3>
        <Button variant="outline" size="sm" onClick={loadCacheEntries}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {cacheEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No images cached yet</p>
          <p className="text-sm mt-1">Load some S3 images to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 mb-3">
            <strong>{cacheEntries.length}</strong> images cached
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {cacheEntries.map((entry, index) => (
              <div
                key={entry.key}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-yellow-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        #{index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                      {getShortUrl(entry.key)}
                    </p>
                    
                    <p className="text-xs text-gray-500 font-mono truncate">
                      {entry.key}
                    </p>
                    
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-600">
                        Size: <strong>{formatSize(entry.size)}</strong>
                      </span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => copyToClipboard(entry.key)}
                      >
                        {copiedKey === entry.key ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy URL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
        <p className="font-semibold mb-1">💡 Cache Key Structure:</p>
        <p>Key = Full S3 URL (e.g., https://bucket.s3.region.amazonaws.com/folder/file.png)</p>
        <p className="mt-1">Each unique URL is cached separately for fast lookup.</p>
      </div>
    </Card>
  );
}
