import { NextResponse, type NextRequest } from 'next/server'

/**
 * Slim middleware for the Cloudflare admin Worker only.
 * Public locale rewriting stays on the static Pages site; this Worker serves /admin + /api.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    requestHeaders.set('x-nw-shell', 'admin')
    requestHeaders.set('x-locale', 'ne')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
