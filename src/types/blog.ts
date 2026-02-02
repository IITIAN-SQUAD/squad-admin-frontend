// Re-export from blog service for consistency
export type {
  Blog,
  BlogListItem,
  CreateBlogRequest,
  UpdateBlogRequest,
  BlogListResponse,
  BlogQuizQuestion,
  BlogOption
} from '../services/blog.service';

// Form values type - removed, now defined in BlogForm.tsx to avoid conflicts

export interface Author {
  id: string;
  name: string;
  email: string;
  description: string;
  profile_picture: string;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
  associated_blogs: number;
  blogs: any[];
}

export interface Category {
  id: string;
  name: string;
  created_by_admin_id: string;
  created_at: string;
  updated_at: string;
  blog_count: number;
}

export interface BlogFilter {
  status?: string;
  category?: string;
  author?: string;
  search?: string;
  featured?: boolean;
}

// Form validation types
export interface BlogFormErrors {
  heading?: string;
  sub_heading?: string;
  banner_image?: string;
  body?: string;
  summary?: string;
  meta_title?: string;
  meta_description?: string;
  meta_image?: string;
  canonical_url?: string;
  slug?: string;
  category_id?: string;
  author_id?: string;
  tags?: string;
}

// Quiz question type for form state
import type { BlogOption } from '../services/blog.service';

export interface QuizQuestion {
  id: string;
  text: string;
  options: BlogOption[];
  correct_answer_label: string;
}

// UI State types
import type { BlogListItem } from '../services/blog.service';

export interface BlogManagementState {
  blogs: BlogListItem[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  filters: BlogFilter;
}
