/**
 * Tavily API Service - For fetching current context and information
 * Version: 2.0 - Using proxy API
 */

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
  images?: string[];
}

class TavilyService {
  private readonly BASE_URL = '/api/tavily';

  constructor() {
    // API key is now handled server-side
    console.log('[TavilyService] Initialized with proxy API');
  }

  /**
   * Search for current information on a topic
   */
  async search(query: string, options?: {
    searchDepth?: 'basic' | 'advanced';
    maxResults?: number;
    includeAnswer?: boolean;
    includeImages?: boolean;
  }): Promise<TavilySearchResponse> {
    try {
      console.log('[TavilyService] Searching for:', query);

      const response = await fetch(`${this.BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          search_depth: options?.searchDepth || 'advanced',
          max_results: options?.maxResults || 5,
          include_answer: options?.includeAnswer !== false,
          include_images: options?.includeImages || false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[TavilyService] Search results:', data);
      return data;
    } catch (error: any) {
      console.error('[TavilyService] Search failed:', error);
      throw new Error(error.message || 'Failed to fetch context from Tavily');
    }
  }

  /**
   * Get comprehensive context for blog writing
   */
  async getContextForBlog(topic: string): Promise<{
    summary: string;
    keyPoints: string[];
    sources: TavilySearchResult[];
  }> {
    try {
      const searchResults = await this.search(topic, {
        searchDepth: 'advanced',
        maxResults: 5,
        includeAnswer: true,
      });

      // Extract key information
      const summary = searchResults.answer || '';
      const keyPoints = searchResults.results
        .slice(0, 3)
        .map(result => result.content.substring(0, 200) + '...');
      
      return {
        summary,
        keyPoints,
        sources: searchResults.results,
      };
    } catch (error: any) {
      console.error('[TavilyService] Failed to get context:', error);
      // Return empty context instead of throwing to allow blog generation to continue
      return {
        summary: '',
        keyPoints: [],
        sources: [],
      };
    }
  }
}

export const tavilyService = new TavilyService();
