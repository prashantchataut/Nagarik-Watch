import { NextResponse, type NextRequest } from 'next/server'
import { isAllowedPublicFirstSegment } from '@/lib/public-path-allowlist'

/**
 * Public URLs keep Nepali at the root and English under /en. Internally the App Router
 * receives an explicit /ne segment so one typed route tree can render both languages.
 * Admin requests also receive a stable pathname header for the protected admin layout.
 */
function firstSegment(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] ?? ''
}

function hardNotFound(request: NextRequest, locale: 'ne' | 'en'): NextResponse {
  // Locale rewrite makes App Router notFound() a soft 404 (HTTP 200). Unknown
  // top-level paths must fail closed here so crawlers see a real 404 status.
  const destination = request.nextUrl.clone()
  destination.pathname = locale === 'en' ? '/en/__not-found' : '/ne/__not-found'
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)
  return NextResponse.rewrite(destination, {
    status: 404,
    request: { headers: requestHeaders },
  })
}

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
    requestHeaders.set('x-nw-shell', 'admin')
    requestHeaders.set('x-locale', 'ne')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (pathname === '/en/__not-found' || pathname === '/ne/__not-found') {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', pathname.startsWith('/en') ? 'en' : 'ne')
    return NextResponse.next({
      status: 404,
      request: { headers: requestHeaders },
    })
  }

  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const segment = firstSegment(pathname.slice(3) || '/')
    if (segment && segment !== '__not-found' && !isAllowedPublicFirstSegment(segment)) {
      return hardNotFound(request, 'en')
    }
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', 'en')
    requestHeaders.set('x-pathname', pathname)
    requestHeaders.set('x-nw-shell', resolveShell(pathname.slice(3) || '/'))
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  const segment = firstSegment(pathname)
  if (segment && segment !== '__not-found' && !isAllowedPublicFirstSegment(segment)) {
    return hardNotFound(request, 'ne')
  }

  const internal = request.nextUrl.clone()
  internal.pathname = `/ne${pathname === '/' ? '' : pathname}`
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', 'ne')
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-nw-shell', resolveShell(pathname))
  return NextResponse.rewrite(internal, { request: { headers: requestHeaders } })
}

function resolveShell(pathWithoutEnPrefix: string): 'public' | 'auth' | 'journalist' {
  const parts = pathWithoutEnPrefix.split('/').filter(Boolean)
  const seg = parts[0] ?? ''
  if (seg === 'journalist') return 'journalist'
  // Legacy aliases
  if (seg === 'login' || seg === 'register') return 'auth'
  if (seg === 'auth') {
    const page = parts[1] ?? ''
    // Credential / invite forms stay minimal. Account pages keep full portal chrome.
    const formOnly = new Set([
      'login',
      'signup',
      'forgot-password',
      'reset-password',
      'invite',
      'mfa',
      'change-password',
    ])
    if (!page || formOnly.has(page)) return 'auth'
    return 'public'
  }
  return 'public'
}

export const config = {
  matcher: [
    '/((?!api|feeds/|_next/static|_next/image|favicon.ico|favicon.png|icon.png|icon.svg|apple-icon.png|robots.txt|sitemap.xml|news-sitemap.xml|rss.xml|atom.xml|ads.txt|sellers.json|llms.txt|llms-full.txt|manifest.webmanifest|sw.js|opengraph-image.png).*)',
  ],
}
