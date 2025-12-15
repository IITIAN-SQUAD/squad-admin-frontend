/**
 * API Client for backend communication
 * Base URL: http://localhost:8080
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include cookies in requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      console.log('[API Client] Token from localStorage:', token ? 'exists' : 'missing');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
    }

    console.log('[API Client] Making request to:', url);
    console.log('[API Client] Headers:', config.headers);

    try {
      const response = await fetch(url, config);
      console.log('[API Client] Response status:', response.status);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.ok) {
          return { message: 'Success' } as T;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
