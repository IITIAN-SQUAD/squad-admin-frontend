/**
 * Image Cache Service
 * In-memory caching for S3 images to reduce redundant GET requests
 */

interface CacheEntry {
  blob: Blob;
  url: string;
  timestamp: number;
  size: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalSize: number;
  entries: number;
}

export class ImageCacheService {
  private static instance: ImageCacheService;
  private cache: Map<string, CacheEntry>;
  private maxCacheSize: number; // in bytes
  private maxAge: number; // in milliseconds
  private stats: CacheStats;

  private constructor() {
    this.cache = new Map();
    
    // Read from environment variables with fallbacks
    const maxCacheSizeMB = typeof window !== 'undefined' 
      ? parseInt(process.env.NEXT_PUBLIC_IMAGE_CACHE_SIZE_MB || '100')
      : 100;
    const maxAgeHours = typeof window !== 'undefined'
      ? parseInt(process.env.NEXT_PUBLIC_IMAGE_CACHE_TTL_HOURS || '1')
      : 1;
    
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert MB to bytes
    this.maxAge = maxAgeHours * 60 * 60 * 1000; // Convert hours to milliseconds
    
    this.stats = {
      hits: 0,
      misses: 0,
      totalSize: 0,
      entries: 0,
    };

    console.log(`[Image Cache] Initialized with ${maxCacheSizeMB}MB cache, ${maxAgeHours}h TTL`);

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * Configure cache settings
   */
  configure(options: { maxCacheSize?: number; maxAge?: number }) {
    if (options.maxCacheSize) {
      this.maxCacheSize = options.maxCacheSize;
    }
    if (options.maxAge) {
      this.maxAge = options.maxAge;
    }
  }

  /**
   * Get image from cache or fetch from S3
   */
  async getImage(url: string): Promise<string> {
    // Check if in cache and not expired
    const cached = this.cache.get(url);
    if (cached && !this.isExpired(cached)) {
      this.stats.hits++;
      console.log(`[Cache HIT] ${url}`);
      return cached.url;
    }

    // Cache miss - fetch from S3
    this.stats.misses++;
    console.log(`[Cache MISS] ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Add to cache
      this.set(url, blob, objectUrl);

      return objectUrl;
    } catch (error) {
      console.error('Failed to fetch and cache image:', error);
      // Return original URL as fallback
      return url;
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    const promises = urls.map(url => this.getImage(url));
    await Promise.all(promises);
    console.log(`[Cache] Preloaded ${urls.length} images`);
  }

  /**
   * Add image to cache
   */
  private set(key: string, blob: Blob, objectUrl: string): void {
    // Check if we need to make space
    while (this.stats.totalSize + blob.size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Revoke old object URL if exists
    const existing = this.cache.get(key);
    if (existing) {
      URL.revokeObjectURL(existing.url);
      this.stats.totalSize -= existing.size;
    }

    // Add new entry
    this.cache.set(key, {
      blob,
      url: objectUrl,
      timestamp: Date.now(),
      size: blob.size,
    });

    this.stats.totalSize += blob.size;
    this.stats.entries = this.cache.size;
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.remove(oldestKey);
    }
  }

  /**
   * Remove entry from cache
   */
  remove(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.stats.totalSize -= entry.size;
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
      console.log(`[Cache] Removed: ${key}`);
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.remove(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalSize: 0,
      entries: 0,
    };
    console.log('[Cache] Cleared all entries');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; sizeMB: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      sizeMB: this.stats.totalSize / (1024 * 1024),
    };
  }

  /**
   * Check if URL is cached
   */
  has(url: string): boolean {
    const entry = this.cache.get(url);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Get cache size in MB
   */
  getSizeMB(): number {
    return this.stats.totalSize / (1024 * 1024);
  }
}

// Export singleton instance
export const imageCacheService = ImageCacheService.getInstance();

// Configure defaults (can be changed)
imageCacheService.configure({
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxAge: 60 * 60 * 1000, // 1 hour
});
