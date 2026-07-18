import { NextResponse, type NextRequest } from 'next/server'

/**
 * Public URLs keep Nepali at the root and English under /en. Internally the App Router
 * receives an explicit /ne segment so one typed route tree can render both languages.
 * Admin requests also receive a stable pathname header for the protected admin layout.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === '/ne' || pathname.startsWith('/ne/')) {
    const canonical = request.nextUrl.clone()
    canonical.pathname = pathname.slice(3) || '/'
    return NextResponse.redirect(canonical, 308)
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    requestHeaders.set('x-locale', 'ne')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', 'en')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const internal = request.nextUrl.clone()
  internal.pathname = `/ne${pathname === '/' ? '' : pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', 'ne')
  return NextResponse.rewrite(internal, { request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    '/((?!api|feeds/|_next/static|_next/image|favicon.ico|favicon.png|icon.png|icon.svg|apple-icon.png|robots.txt|sitemap.xml|news-sitemap.xml|rss.xml|atom.xml|ads.txt|sellers.json|llms.txt|llms-full.txt|manifest.webmanifest|sw.js|opengraph-image.png).*)',
  ],
}
