/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import apiClient from './api-client';

export interface RequestOtpResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface LoginWithOtpRequest {
  email: string;
  otp: string;
  password: string;
}

export interface AdminApiResponse {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    type: string;
    permissions: string[];
  };
  roleId?: string;
  isActive?: boolean;
  passwordSet?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifyOtpResponse {
  token: string;
  admin: AdminApiResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Request OTP for admin login
   * POST /v1/auth/user/request-otp/{email}
   */
  async requestOtp(email: string): Promise<RequestOtpResponse> {
    try {
      const response = await apiClient.post<RequestOtpResponse>(
        `/v1/auth/user/request-otp/${encodeURIComponent(email)}`
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Failed to send OTP');
      }
      throw new Error('Failed to send OTP');
    }
  }

  /**
   * Verify OTP and complete login
   * POST /v1/auth/user/verify-otp
   */
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await apiClient.post<VerifyOtpResponse>(
        '/v1/auth/user/verify-otp',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Invalid OTP');
      }
      throw new Error('Invalid OTP');
    }
  }

  /**
   * Login with email, password, and OTP
   * POST /v1/auth/admin/login
   */
  async loginWithOtp(data: LoginWithOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await apiClient.post<VerifyOtpResponse>(
        '/v1/auth/admin/login',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  }

  /**
   * Login with email and password (triggers OTP)
   * This is a convenience method that combines email/password check with OTP request
   */
  async login(data: LoginRequest): Promise<RequestOtpResponse> {
    try {
      // First, validate credentials and request OTP
      // Backend should validate email/password and send OTP
      const response = await apiClient.post<RequestOtpResponse>(
        '/v1/auth/user/login',
        data
      );
      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  }

  /**
   * Get admin profile
   * GET /v1/auth/admin
   */
  async getAdminProfile(): Promise<VerifyOtpResponse> {
    const response = await apiClient.get<VerifyOtpResponse>(
      '/v1/auth/admin'
    );
    return response;
  }

  /**
   * Verify auth token
   * GET /v1/auth/user/verify
   */
  async verifyToken(): Promise<VerifyOtpResponse> {
    try {
      const response = await apiClient.get<VerifyOtpResponse>(
        '/v1/auth/user/verify'
      );
      return response;
    } catch (error) {
      throw new Error('Token verification failed');
    }
  }

  /**
   * Logout
   * POST /v1/auth/admin/logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/v1/auth/admin/logout', {});
    } catch (error) {
      // Ignore logout errors, clear local storage anyway
      console.error('Logout API error (non-critical):', error);
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
