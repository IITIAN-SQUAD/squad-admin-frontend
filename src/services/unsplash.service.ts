/**
 * Unsplash Service - For fetching random images for blog banners
 */

export interface UnsplashImage {
  id: string;
  url: string;
  downloadUrl: string;
  author: string;
  authorUrl: string;
}

class UnsplashService {
  private readonly ACCESS_KEY: string;
  private readonly BASE_URL = 'https://api.unsplash.com';

  constructor() {
    this.ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
  }

  /**
   * Get a random image for a topic
   */
  async getRandomImage(query: string): Promise<string> {
    try {
      // If no API key, return a placeholder from Unsplash's source API
      if (!this.ACCESS_KEY) {
        console.warn('[UnsplashService] No API key, using source.unsplash.com');
        return `https://source.unsplash.com/800x400/?${encodeURIComponent(query)}`;
      }

      console.log('[UnsplashService] Fetching random image for:', query);

      const response = await fetch(
        `${this.BASE_URL}/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${this.ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('[UnsplashService] API error, using fallback');
        return `https://source.unsplash.com/800x400/?${encodeURIComponent(query)}`;
      }

      const data = await response.json();
      return data.urls.regular;
    } catch (error) {
      console.error('[UnsplashService] Failed to fetch image:', error);
      // Fallback to source.unsplash.com
      return `https://source.unsplash.com/800x400/?${encodeURIComponent(query)}`;
    }
  }

  /**
   * Get multiple random images
   */
  async getRandomImages(query: string, count: number): Promise<string[]> {
    const images: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const imageUrl = await this.getRandomImage(query);
        images.push(imageUrl);
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('[UnsplashService] Failed to fetch image', i, error);
        images.push(`https://source.unsplash.com/800x400/?${encodeURIComponent(query)},${i}`);
      }
    }
    
    return images;
  }
}

export const unsplashService = new UnsplashService();
