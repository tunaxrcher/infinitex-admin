import { NextRequest, NextResponse } from 'next/server'

import { apiMiddleware } from '@src/shared/middleware/api'
import { authMiddleware } from '@src/shared/middleware/auth'

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // เช็คว่าเป็น API route หรือไม่
  if (path.startsWith('/api')) {
    if (path.startsWith('/api/auth')) {
      return NextResponse.next()
    }
    return apiMiddleware(req)
  }

  return authMiddleware(req)
}

// Define which routes to apply this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|sw\\.js).*)',

    // Alternative approach with explicit routes
    '/auth/login',
    '/api/:path*',
  ],
}
