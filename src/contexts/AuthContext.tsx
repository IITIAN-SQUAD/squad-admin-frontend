"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Admin, Permission } from "@/src/types/admin";

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const storedAdmin = localStorage.getItem('admin');
        
        console.log('[AuthContext] Checking auth - Token:', !!token, 'StoredAdmin:', storedAdmin);
        
        if (token) {
          // If we have stored admin data, use it immediately
          if (storedAdmin && storedAdmin !== 'undefined' && storedAdmin !== 'null') {
            try {
              const parsedAdmin = JSON.parse(storedAdmin);
              console.log('[AuthContext] Using stored admin data:', parsedAdmin);
              setAdmin(parsedAdmin);
            } catch (e) {
              console.error('[AuthContext] Failed to parse stored admin:', e);
              localStorage.removeItem('admin');
            }
          }
          
          // Always try to fetch fresh data from backend
          try {
            console.log('[AuthContext] Fetching admin profile from API...');
            const authService = (await import('@/src/services/auth.service')).default;
            const response = await authService.getAdminProfile();
            console.log('[AuthContext] API response:', response);
            
            // Convert API response to Admin type
            const adminData: Admin = {
              id: response.admin.id,
              email: response.admin.email,
              name: response.admin.name,
              roleId: response.admin.roleId || response.admin.role.id,
              role: {
                id: response.admin.role.id,
                name: response.admin.role.name,
                type: response.admin.role.type as any,
                permissions: response.admin.role.permissions as any[],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              isActive: response.admin.isActive ?? true,
              passwordSet: response.admin.passwordSet ?? true,
              lastLogin: response.admin.lastLogin ? new Date(response.admin.lastLogin) : undefined,
              createdAt: response.admin.createdAt ? new Date(response.admin.createdAt) : new Date(),
              updatedAt: response.admin.updatedAt ? new Date(response.admin.updatedAt) : new Date(),
            };
            
            // Update stored admin data
            console.log('[AuthContext] Storing admin data:', adminData);
            localStorage.setItem('admin', JSON.stringify(adminData));
            setAdmin(adminData);
          } catch (apiError: any) {
            // API call failed - token is likely invalid
            console.error('[AuthContext] Failed to fetch admin profile from API:', apiError);
            console.log('[AuthContext] Token invalid or API error, clearing session and redirecting to login');
            
            // Clear session and redirect to login
            localStorage.removeItem('auth_token');
            localStorage.removeItem('admin');
            document.cookie = 'auth_token=; path=/; max-age=0';
            document.cookie = 'jwt=; path=/; max-age=0';
            setAdmin(null);
            router.push('/login');
          }
        } else {
          console.log('[AuthContext] No token found, user not authenticated');
        }
      } catch (error) {
        console.error('[AuthContext] Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { token, admin: loggedInAdmin } = await response.json();
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('admin', JSON.stringify(loggedInAdmin));
    setAdmin(loggedInAdmin);
  };

  const logout = async () => {
    // Clear local storage and cookies first
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin');
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'jwt=; path=/; max-age=0';
    
    setAdmin(null);
    
    // Call logout API (non-blocking)
    try {
      const authService = (await import('@/src/services/auth.service')).default;
      await authService.logout();
    } catch (error) {
      // Ignore API errors, already cleared local data
      console.warn('Logout API failed (non-critical):', error);
    }
    
    router.push('/login');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!admin || !admin.role) return false;
    return admin.role.permissions.includes(permission);
  };

  const isSuperAdmin = (): boolean => {
    if (!admin || !admin.role) return false;
    return admin.role.type === 'super_admin';
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        hasPermission,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
