"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/set-password'];

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    
    if (!isPublicRoute) {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        // Not authenticated, redirect to login
        router.push('/login');
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}
