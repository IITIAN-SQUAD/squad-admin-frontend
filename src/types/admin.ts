export type Permission = 
  | 'exam_management'
  | 'subject_management'
  | 'paper_management'
  | 'question_management'
  | 'blog_management'
  | 'author_management'
  | 'media_management'
  | 'admin_management'
  | 'bulk_upload';

export type RoleType = 'super_admin' | 'admin' | 'content_editor' | 'viewer';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  permissions: Permission[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role?: Role; // Populated when fetched
  isActive: boolean;
  passwordSet: boolean;
  lastLogin?: Date;
  createdBy?: string; // Admin ID who created this admin
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminInvite {
  id: string;
  email: string;
  name: string;
  roleId: string;
  token: string;
  expiresAt: Date;
  createdBy: string;
  createdAt: Date;
}

export interface AuthSession {
  admin: Admin;
  token: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFAVerification {
  email: string;
  otp: string;
  sessionToken: string;
}

export interface SetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
