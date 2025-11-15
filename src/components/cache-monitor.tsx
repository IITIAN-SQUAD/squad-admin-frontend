"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { imageCacheService } from '@/src/services/image-cache.service';
import { Trash2, RefreshCw, Database, TrendingUp } from 'lucide-react';

export function CacheMonitor() {
  const [stats, setStats] = useState(imageCacheService.getStats());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setStats(imageCacheService.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    imageCacheService.clear();
    setStats(imageCacheService.getStats());
  };

  const handleRefresh = () => {
    setStats(imageCacheService.getStats());
  };

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <Database className="w-4 h-4 mr-2" />
        Cache Stats
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 p-4 w-80 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" />
          Image Cache Monitor
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0"
        >
          ×
        </Button>
      </div>

      <div className="space-y-3">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-blue-50 rounded">
            <p className="text-xs text-blue-600 font-medium">Cache Hits</p>
            <p className="text-lg font-bold text-blue-900">{stats.hits}</p>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <p className="text-xs text-orange-600 font-medium">Cache Misses</p>
            <p className="text-lg font-bold text-orange-900">{stats.misses}</p>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-green-600 font-medium">Hit Rate</p>
            <p className="text-lg font-bold text-green-900">
              {stats.hitRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <p className="text-xs text-purple-600 font-medium">Entries</p>
            <p className="text-lg font-bold text-purple-900">{stats.entries}</p>
          </div>
        </div>

        {/* Size Info */}
        <div className="p-3 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">Cache Size</span>
            <span className="text-sm font-semibold">
              {stats.sizeMB.toFixed(2)} MB
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all"
              style={{ width: `${(stats.sizeMB / 100) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Max: 100 MB</p>
        </div>

        {/* Performance Indicator */}
        {stats.hitRate > 0 && (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div className="flex-1">
              <p className="text-xs text-green-700 font-medium">
                Performance Boost
              </p>
              <p className="text-xs text-green-600">
                {stats.hits} requests saved from S3
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="flex-1"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear Cache
          </Button>
        </div>
      </div>
    </Card>
  );
}
