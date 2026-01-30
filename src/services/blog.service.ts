import { apiClient } from './api-client';

// Blog Types matching API structure
export interface BlogOption {
  label: string;
  option_text: string;
}

export interface BlogQuizQuestion {
  id: string;
  text: string;
  options: BlogOption[];
  correct_answer_label: string;
}

export interface Blog {
  id: string;
  heading: string;
  sub_heading: string;
  banner_image: string;
  body: string;
  summary: string;
  slug: string;
  quiz_questions: BlogQuizQuestion[];
  meta_title: string;
  meta_description: string;
  meta_image: string;
  canonical_url: string;
  schema: string[];
  blog_visibility_status: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  views_count: number;
  share_count: number;
  likes_count: number;
  comments_count: number;
  popularity_score: number;
  is_liked_by_user: boolean;
  created_at: number;
  updated_at: number;
  // Nested objects from API
  author: {
    id: string;
    name: string;
    email: string;
    description: string;
    profile_picture: string | null;
    created_by_admin_id: string;
    created_at: number;
    updated_at: number;
    associated_blogs: any;
    blogs: any;
  };
  category: {
    id: string;
    name: string;
    created_by_admin_id: string;
    created_at: number;
    updated_at: number;
    blog_count: any;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
}

export interface BlogListItem {
  id: string;
  heading: string;
  sub_heading: string;
  banner_image: string;
  summary: string;
  category_name: string;
  author_name: string;
  author_profile_picture: string;
  tags: string[];
  views_count: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
  popularity_score: number;
  read_time: number;
  featured: boolean;
  published_at: string;
  updated_at: string;
  cumulative_views: number;
  previous_month_views: number;
  cumulative_likes: number;
  previous_month_likes: number;
  cumulative_comments: number;
  previous_month_comments: number;
  cumulative_shares: number;
  previous_month_shares: number;
}

export interface CreateBlogRequest {
  heading: string;
  sub_heading: string;
  banner_image: string;
  body: string;
  summary: string;
  quiz_questions?: BlogQuizQuestion[];
  meta_title: string;
  meta_description: string;
  meta_image: string;
  canonical_url: string;
  schema: string[];
  slug: string;
  blog_visibility_status: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  category_id: string;
  author_id: string;
  tags: string[];
}

export interface UpdateBlogRequest extends Partial<CreateBlogRequest> {}

export interface OverallAnalytics {
  cumulative_views: number;
  previous_month_views: number;
  cumulative_likes: number;
  previous_month_likes: number;
  cumulative_comments: number;
  previous_month_comments: number;
  cumulative_shares: number;
  previous_month_shares: number;
}

export interface BlogFilterRequest {
  search_text?: string;
  category_id?: string;
  visibility_status?: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED';
  page: number;
  size: number;
}

export interface BlogFilterResponse {
  overall_analytics: OverallAnalytics;
  blogs: BlogListItem[];
  current_page: number;
  page_size: number;
  total_blogs: number;
  total_pages: number;
}

export interface BlogListResponse {
  blogs: BlogListItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface BlogService {
  // Get all blogs with filters and analytics
  filterBlogs(filters: BlogFilterRequest): Promise<BlogFilterResponse>;
  
  // Get all blogs with pagination (legacy)
  getAllBlogs(page?: number, size?: number): Promise<BlogListResponse>;
  
  // Get blog by ID
  getBlogById(id: string): Promise<Blog>;
  
  // Create new blog
  createBlog(blogData: CreateBlogRequest): Promise<Blog>;
  
  // Update existing blog
  updateBlog(id: string, blogData: UpdateBlogRequest): Promise<Blog>;
  
  // Delete blog
  deleteBlog(id: string): Promise<void>;
}

class BlogServiceImpl implements BlogService {
  async filterBlogs(filters: BlogFilterRequest): Promise<BlogFilterResponse> {
    try {
      console.log('Making filter request with filters:', filters);
      const response = await apiClient.post<BlogFilterResponse>('/v0/admin/blog/filter', filters);
      console.log('Filter API Response:', response);
      return response;
    } catch (error) {
      console.error('Error filtering blogs:', error);
      throw error;
    }
  }

  async getAllBlogs(page: number = 0, size: number = 20): Promise<BlogListResponse> {
    try {
      const response = await apiClient.get(`/v0/admin/blog?page=${page}&size=${size}`);
      console.log('Raw API Response:', response);
      
      // Handle response format - the API returns the array directly
      if (Array.isArray(response.data)) {
        const result = {
          blogs: response.data,
          total: response.data.length,
          page,
          size,
          totalPages: Math.ceil(response.data.length / size)
        };
        console.log('Processed Response:', result);
        return result;
      }
      
      console.log('Response is not array:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      throw error;
    }
  }

  async getBlogById(id: string): Promise<Blog> {
    try {
      const response = await apiClient.get(`/v0/admin/blog/${id}`);
      console.log('getBlogById response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching blog by ID:', error);
      throw error;
    }
  }

  async createBlog(blogData: CreateBlogRequest): Promise<Blog> {
    try {
      const response = await apiClient.post('/v0/admin/blog', blogData);
      return response.data;
    } catch (error) {
      console.error('Error creating blog:', error);
      throw error;
    }
  }

  async updateBlog(id: string, blogData: UpdateBlogRequest): Promise<Blog> {
    try {
      const response = await apiClient.put(`/v0/admin/blog/${id}`, blogData);
      return response.data;
    } catch (error) {
      console.error('Error updating blog:', error);
      throw error;
    }
  }

  async deleteBlog(id: string): Promise<void> {
    try {
      await apiClient.delete(`/v0/admin/blog/${id}`);
    } catch (error) {
      console.error('Error deleting blog:', error);
      throw error;
    }
  }
}

export const blogService: BlogService = new BlogServiceImpl();
