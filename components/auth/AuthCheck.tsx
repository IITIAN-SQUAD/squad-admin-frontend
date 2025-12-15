"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ['/login', '/forgot-password', '/set-password'];

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    console.log('[AuthCheck] Starting check for:', pathname);
    
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
    
    if (isPublicRoute) {
      console.log('[AuthCheck] Public route, rendering');
      setIsChecking(false);
      return;
    }

    // Simply allow access - middleware already validated the cookies
    // If cookies are invalid, middleware will redirect to login
    console.log('[AuthCheck] Protected route, middleware already validated');
    setIsChecking(false);
  }, [pathname, router]);

  if (isChecking) {
    console.log('[AuthCheck] Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  console.log('[AuthCheck] Rendering children');
  return <>{children}</>;
}
