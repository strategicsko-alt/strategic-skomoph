import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /editor routes except the login page itself
  if (pathname.startsWith('/editor') && !pathname.startsWith('/editor/login')) {
    const authCookie = request.cookies.get('editor_auth');
    
    // If no cookie or cookie is invalid (we will just check presence for now, 
    // real validation should check a signed JWT or similar, but for a simple shared password 
    // a basic cookie check works. We'll improve it later if needed).
    if (!authCookie || authCookie.value !== 'authenticated') {
      // Redirect to login page
      const loginUrl = new URL('/editor/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/editor/:path*',
};
