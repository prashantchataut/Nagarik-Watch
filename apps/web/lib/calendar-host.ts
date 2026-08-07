import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/site'

/**
 * Optional पात्रो product host (preferred: https://patro.nagarikwatch.com).
 * Legacy `calendar.*` hosts still work. When set, पात्रो entry points leave the
 * news apex for the utility subdomain. Middleware maps that host's `/` → `/patro`
 * (and `/en` → `/en/patro`), and apex `/patro` 308-redirects to the subdomain.
 */
export function getCalendarOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_CALENDAR_HOST?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    return url.origin
  } catch {
    return null
  }
}

export function calendarHostname(): string | null {
  const origin = getCalendarOrigin()
  if (!origin) return null
  try {
    return new URL(origin).hostname.toLowerCase()
  } catch {
    return null
  }
}

function isPatroOrCalendarHost(host: string): boolean {
  return (
    host === 'patro.localhost' ||
    host === 'calendar.localhost' ||
    host.startsWith('patro.') ||
    host.startsWith('calendar.')
  )
}

/** True for configured पात्रो/calendar host or any `patro.*` / `calendar.*` hostname. */
export function isCalendarHostname(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false
  const host = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  if (!host) return false
  const configured = calendarHostname()
  if (configured && host === configured) return true
  return isPatroOrCalendarHost(host)
}

/**
 * Apex desk paths that should permanently redirect to the पात्रो subdomain
 * when `NEXT_PUBLIC_CALENDAR_HOST` is set.
 */
export function apexPatroLocale(pathname: string): Locale | null {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/patro') return 'ne'
  if (path === '/en/patro') return 'en'
  return null
}

/** Subdomain landing URL for a locale (root maps to the desk via middleware). */
export function patroSubdomainLanding(locale: Locale): string | null {
  const origin = getCalendarOrigin()
  if (!origin) return null
  return locale === 'en' ? `${origin}/en` : `${origin}/`
}

/** Public entry URL for the पात्रो desk (absolute when subdomain is configured). */
export function patroEntryHref(locale: Locale): string {
  const landing = patroSubdomainLanding(locale)
  if (landing) return landing
  return localizeHref(locale, '/patro')
}

/** Absolute link back to the news apex from the calendar host. */
export function mainSiteHref(locale: Locale, path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const local = localizeHref(locale, normalized === '/' ? '/' : normalized)
  try {
    return new URL(local, SITE_URL).toString()
  } catch {
    return local
  }
}
