import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow public routes
  const publicRoutes = ['/', '/login', '/signup', '/api/webhooks']
  const pathname = request.nextUrl.pathname

  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For API routes that need auth, check in the route handler itself
  // This middleware is mainly for future use if needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

