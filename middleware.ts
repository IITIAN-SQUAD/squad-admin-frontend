import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/set-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Get auth tokens from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const jwtToken = request.cookies.get('jwt')?.value;
  
  // User is authenticated if either token exists
  const isAuthenticated = !!(authToken || jwtToken);

  // If accessing a protected route without auth, redirect to login
  if (!isPublicRoute && !isAuthenticated) {
    console.log(`[Middleware] Redirecting ${pathname} to /login - No auth token`);
    
    // Clear any stale cookies
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    response.cookies.delete('jwt');
    
    // Add return URL to redirect back after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/auth pages while authenticated, redirect to home
  if (isPublicRoute && isAuthenticated && pathname !== '/set-password') {
    console.log(`[Middleware] Redirecting ${pathname} to / - Already authenticated`);
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
