import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /editor routes except the login page itself
  if (pathname.startsWith('/editor') && !pathname.startsWith('/editor/login')) {
    const authCookie = request.cookies.get('editor_auth');
    
    // If no cookie or cookie is invalid
    if (!authCookie || !['authenticated', 'superadmin'].includes(authCookie.value)) {
      // Redirect to login page
      const loginUrl = new URL('/editor/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Additional protection for admin route
    if (pathname.startsWith('/editor/admin') && authCookie.value !== 'superadmin') {
      const dashboardUrl = new URL('/editor/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/editor/:path*',
};
