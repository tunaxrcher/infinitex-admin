import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// หน้าที่ไม่ต้อง login
const publicPaths = [
  '/signin',
  '/signup',
  '/reset-password',
  '/verify-email',
  '/change-password',
  '/login', // LINE LIFF login page
  '/loan/check', // Public loan check page (uses PIN instead of login)
  '/api/loan-check', // Public API for loan check
  '/api/auth', // NextAuth API routes
  '/api/customers/analyze-id-card', // Public API for ID card analysis (used in loan check)
  '/api/customers/generate-phone', // Public API for generating phone (used in loan check)
];

// Static files and assets
const staticPaths = ['/_next', '/favicon.ico', '/images', '/media', '/fonts'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip API routes that don't need auth
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow public pages without authentication
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;

  // If not authenticated and trying to access protected route, redirect to signin
  if (!isAuthenticated) {
    const signInUrl = new URL('/signin', req.url);
    signInUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// Configure which paths should be checked by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
