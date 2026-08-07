import { NextResponse, type NextRequest } from 'next/server'
import { isAllowedPublicFirstSegment } from '@/lib/public-path-allowlist'
import {
  apexPatroLocale,
  getCalendarOrigin,
  isCalendarHostname,
  patroSubdomainLanding,
} from '@/lib/calendar-host'

/**
 * Public URLs keep Nepali at the root and English under /en. Internally the App Router
 * receives an explicit /ne segment so one typed route tree can render both languages.
 * Admin requests also receive a stable pathname header for the protected admin layout.
 *
 * पात्रो subdomain (`patro.*`, `calendar.*`, or NEXT_PUBLIC_CALENDAR_HOST): bare `/`
 * and `/en` map to the पात्रो desk so the utility product can live on its own host.
 * When the env host is set, apex `/patro` permanently redirects to that subdomain.
 */
function firstSegment(pathname: string): string {
  return pathname.split('/').filter(Boolean)[0] ?? ''
}

function hardNotFound(request: NextRequest, locale: 'ne' | 'en'): NextResponse {
  const destination = request.nextUrl.clone()
  destination.pathname = locale === 'en' ? '/en/__not-found' : '/ne/__not-found'
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-locale', locale)
  return NextResponse.rewrite(destination, {
    status: 404,
    request: { headers: requestHeaders },
  })
}

function withCalendarRoot(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/patro'
  if (pathname === '/en' || pathname === '/en/') return '/en/patro'
  return pathname
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')
  const calendarHost = isCalendarHostname(host)
  const calendarOrigin = getCalendarOrigin()

  // Apex bookmarks → पात्रो product host (308) when configured.
  if (!calendarHost && calendarOrigin) {
    const locale = apexPatroLocale(request.nextUrl.pathname)
    if (locale) {
      const landing = patroSubdomainLanding(locale)
      if (landing) return NextResponse.redirect(landing, 308)
    }
  }

  let pathname = request.nextUrl.pathname
  if (calendarHost) pathname = withCalendarRoot(pathname)

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
    requestHeaders.set('x-nw-shell', resolveShell(pathname.slice(3) || '/', calendarHost))
    if (calendarHost) requestHeaders.set('x-nw-calendar-host', '1')

    // Host mapped `/en` → `/en/patro`: rewrite so the App Router sees the desk path.
    if (pathname !== request.nextUrl.pathname) {
      const destination = request.nextUrl.clone()
      destination.pathname = pathname
      return NextResponse.rewrite(destination, { request: { headers: requestHeaders } })
    }
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
  requestHeaders.set('x-nw-shell', resolveShell(pathname, calendarHost))
  if (calendarHost) requestHeaders.set('x-nw-calendar-host', '1')
  return NextResponse.rewrite(internal, { request: { headers: requestHeaders } })
}

function resolveShell(
  pathWithoutEnPrefix: string,
  calendarHost: boolean,
): 'public' | 'auth' | 'journalist' | 'patro' {
  if (calendarHost) return 'patro'
  const parts = pathWithoutEnPrefix.split('/').filter(Boolean)
  const seg = parts[0] ?? ''
  if (seg === 'journalist') return 'journalist'
  if (seg === 'login' || seg === 'register') return 'auth'
  if (seg === 'auth') {
    const page = parts[1] ?? ''
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
    '/((?!api|feeds/|_next/static|_next/image|media/|favicon.ico|favicon.png|icon.png|icon.svg|apple-icon.png|robots.txt|sitemap.xml|news-sitemap.xml|rss.xml|atom.xml|ads.txt|sellers.json|llms.txt|llms-full.txt|manifest.webmanifest|sw.js|opengraph-image.png).*)',
  ],
}
