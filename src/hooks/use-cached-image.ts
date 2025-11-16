"use client";

import { useState, useEffect } from 'react';
import { imageCacheService } from '@/src/services/image-cache.service';

interface UseCachedImageOptions {
  preload?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function useCachedImage(url: string | null, options: UseCachedImageOptions = {}) {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) {
      setCachedUrl(null);
      return;
    }

    let mounted = true;

    const loadImage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const cached = await imageCacheService.getImage(url);
        
        if (mounted) {
          setCachedUrl(cached);
          setIsLoading(false);
          options.onLoad?.();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load image');
        if (mounted) {
          setError(error);
          setIsLoading(false);
          options.onError?.(error);
        }
      }
    };

    if (options.preload) {
      loadImage();
    }

    return () => {
      mounted = false;
    };
  }, [url, options.preload]);

  return {
    cachedUrl,
    isLoading,
    error,
    isInCache: url ? imageCacheService.has(url) : false,
  };
}

/**
 * Hook to preload multiple images
 */
export function usePreloadImages(urls: string[]) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    if (urls.length === 0) return;

    let mounted = true;

    const preload = async () => {
      setIsLoading(true);
      setLoadedCount(0);

      try {
        await imageCacheService.preloadImages(urls);
        if (mounted) {
          setLoadedCount(urls.length);
        }
      } catch (err) {
        console.error('Failed to preload images:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    preload();

    return () => {
      mounted = false;
    };
  }, [urls]);

  return {
    isLoading,
    loadedCount,
    progress: urls.length > 0 ? (loadedCount / urls.length) * 100 : 0,
  };
}
