import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/site'

/**
 * Optional calendar product host (e.g. https://calendar.nagarikwatch.com).
 * When set, पात्रो entry points leave the news apex for the calendar subdomain.
 * Middleware maps that host's `/` → `/patro` (and `/en` → `/en/patro`).
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

/** True for configured calendar host or any `calendar.*` hostname (local preview). */
export function isCalendarHostname(hostHeader: string | null | undefined): boolean {
  if (!hostHeader) return false
  const host = hostHeader.split(':')[0]?.toLowerCase() ?? ''
  if (!host) return false
  const configured = calendarHostname()
  if (configured && host === configured) return true
  return host === 'calendar.localhost' || host.startsWith('calendar.')
}

/** Public entry URL for the पात्रो desk (absolute when subdomain is configured). */
export function patroEntryHref(locale: Locale): string {
  const origin = getCalendarOrigin()
  if (origin) {
    return locale === 'en' ? `${origin}/en` : `${origin}/`
  }
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
