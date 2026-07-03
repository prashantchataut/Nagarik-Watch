import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALE_COOKIE } from './lib/i18n/locales'

/**
 * Locale + admin-path middleware.
 *
 * Two jobs:
 *   1. Locale routing: Nepali is served from the site root (the /ne segment is
 *      an internal routing detail); English is served from /en/*. Unknown
 *      locales fall back to ne. The chosen locale is written to a cookie so
 *      server components can read the user's last choice on root paths.
 *   2. Admin path stamping: every /admin/* request gets an x-pathname header so
 *      the admin layout can branch (the login page renders standalone; all
 *      other admin routes are session-gated). Next.js does not expose the
 *      pathname to layouts by default, so we stamp it here.
 *
 * Excluded from locale routing: Next internals, the API, the admin app, and
 * root-level files (sitemap, robots, favicons) which are not localized.
 */
const PUBLIC_FILE = /\.(?!well-known)[a-zA-Z0-9]{1,}$/

function stampPath(request: NextRequest): NextResponse {
  const response = NextResponse.next()
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Admin routes: stamp the pathname and pass through (no locale rewrite).
  if (pathname.startsWith('/admin')) {
    return stampPath(request)
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const locale = isEn ? 'en' : DEFAULT_LOCALE

  if (!isEn && !pathname.startsWith(`/${DEFAULT_LOCALE}`)) {
    const url = request.nextUrl.clone()
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
    url.search = search
    const response = NextResponse.rewrite(url)
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  const response = NextResponse.next()
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return response
}

export const config = {
  // Match everything except Next internals and static files. /admin is now
  // included so we can stamp the pathname for the admin layout.
  matcher: ['/((?!_next|api|sitemap\\.xml|robots\\.txt|.*\\..*).*)'],
}
