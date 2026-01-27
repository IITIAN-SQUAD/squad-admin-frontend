/**
 * Category Service - API client for category management
 * Uses Next.js rewrites for backend communication
 */

import apiClient from './api-client';

// Category interfaces
export interface Category {
  id: string;
  name: string;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
  blog_count?: number;
}

export interface CategoryListResponse {
  total_categories: number;
  total_blogs: number;
  category_response_dto_list: Category[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}

class CategoryService {
  private readonly BASE_PATH = '/v0/admin/blog/category';

  /**
   * Get all categories with pagination and blog counts
   */
  async getAllCategories(): Promise<CategoryListResponse> {
    console.log('[CategoryService] Fetching all categories...');
    const response = await apiClient.get<CategoryListResponse>(this.BASE_PATH);
    console.log('[CategoryService] Categories fetched:', response);
    return response;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category> {
    console.log('[CategoryService] Fetching category:', id);
    const response = await apiClient.get<Category>(`${this.BASE_PATH}/${id}`);
    console.log('[CategoryService] Category fetched:', response);
    return response;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    console.log('[CategoryService] Creating category:', data);
    const response = await apiClient.post<Category>(this.BASE_PATH, data);
    console.log('[CategoryService] Category created successfully:', response);
    return response;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    console.log('[CategoryService] Updating category:', id, data);
    const response = await apiClient.put<Category>(`${this.BASE_PATH}/${id}`, data);
    console.log('[CategoryService] Category updated successfully:', response);
    return response;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    console.log('[CategoryService] Deleting category:', id);
    await apiClient.delete(`${this.BASE_PATH}/${id}`);
    console.log('[CategoryService] Category deleted successfully');
  }
}

export const categoryService = new CategoryService();
