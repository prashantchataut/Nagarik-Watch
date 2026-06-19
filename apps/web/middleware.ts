import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALE_COOKIE } from './lib/i18n/locales'

/**
 * Locale middleware (Task 1.9). Keeps URLs clean: Nepali is served from the site root and
 * the /ne segment is an internal routing detail; English is served from /en/*. Unknown
 * locales fall back to ne. The matching locale is also written to a cookie so server
 * components can read the user's last choice even on root paths.
 *
 * Excluded: Next internals, the Payload API, the admin app, and root-level files
 * (sitemap, robots, favicons) which are not localized.
 */
const PUBLIC_FILE = /\.(?!well-known)[a-zA-Z0-9]{1,}$/

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
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
  matcher: ['/((?!_next|api|admin|sitemap\\.xml|robots\\.txt|.*\\..*).*)'],
}
