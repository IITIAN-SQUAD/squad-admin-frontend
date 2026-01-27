import apiClient from './api-client';

// Request/Response interfaces based on the curl examples
interface CreateAuthorRequest {
  name: string;
  email: string;
  description: string;
  profile_picture?: string;
}

interface UpdateAuthorRequest {
  name?: string;
  email?: string;
  description?: string;
  profile_picture?: string;
}

interface AuthorResponse {
  id: string;
  name: string;
  email: string;
  description: string;
  profile_picture?: string;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
  associated_blogs: number;
  blogs: any[];
}

// Frontend Author type (transformed from backend response)
export interface Author {
  id: string;
  name: string;
  email: string;
  description: string;
  profilePicture?: string;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  associatedBlogs: number;
  blogs: any[];
}

class AuthorService {
  private readonly BASE_PATH = '/v0/admin/blog/author';

  /**
   * Transform backend response to frontend Author type
   */
  private transformToAuthor(response: AuthorResponse): Author {
    return {
      id: response.id,
      name: response.name,
      email: response.email,
      description: response.description,
      profilePicture: response.profile_picture,
      createdByAdminId: response.created_by_admin_id,
      createdAt: response.created_at,
      updatedAt: response.updated_at,
      associatedBlogs: response.associated_blogs,
      blogs: response.blogs,
    };
  }

  /**
   * Transform frontend Author to backend request format
   */
  private transformToCreateRequest(author: Partial<Author>): CreateAuthorRequest {
    return {
      name: author.name!,
      email: author.email!,
      description: author.description!,
      profile_picture: author.profilePicture,
    };
  }

  /**
   * Transform frontend Author to backend update request format
   */
  private transformToUpdateRequest(author: Partial<Author>): UpdateAuthorRequest {
    const request: UpdateAuthorRequest = {};
    
    if (author.name !== undefined) request.name = author.name;
    if (author.email !== undefined) request.email = author.email;
    if (author.description !== undefined) request.description = author.description;
    if (author.profilePicture !== undefined) request.profile_picture = author.profilePicture;
    
    return request;
  }

  /**
   * Get all authors
   */
  async getAllAuthors(): Promise<Author[]> {
    try {
      const response = await apiClient.get<AuthorResponse[]>(this.BASE_PATH);
      return response.map(author => this.transformToAuthor(author));
    } catch (error) {
      console.error('Failed to fetch authors:', error);
      throw error;
    }
  }

  /**
   * Create a new author
   */
  async createAuthor(author: Partial<Author>): Promise<Author> {
    try {
      const request = this.transformToCreateRequest(author);
      const response = await apiClient.post<AuthorResponse>(this.BASE_PATH, request);
      return this.transformToAuthor(response);
    } catch (error) {
      console.error('Failed to create author:', error);
      throw error;
    }
  }

  /**
   * Update an existing author
   */
  async updateAuthor(id: string, author: Partial<Author>): Promise<Author> {
    try {
      const request = this.transformToUpdateRequest(author);
      const response = await apiClient.put<AuthorResponse>(`${this.BASE_PATH}/${id}`, request);
      return this.transformToAuthor(response);
    } catch (error) {
      console.error('Failed to update author:', error);
      throw error;
    }
  }

  /**
   * Delete an author
   */
  async deleteAuthor(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/${id}`);
    } catch (error) {
      console.error('Failed to delete author:', error);
      throw error;
    }
  }

  /**
   * Get author by ID (will implement later as requested)
   */
  async getAuthorById(id: string): Promise<Author> {
    try {
      const response = await apiClient.get<AuthorResponse>(`${this.BASE_PATH}/${id}`);
      return this.transformToAuthor(response);
    } catch (error) {
      console.error('Failed to fetch author:', error);
      throw error;
    }
  }
}

export const authorService = new AuthorService();
export default authorService;
