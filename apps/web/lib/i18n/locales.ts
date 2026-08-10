import type { Locale } from '@nagarikwatch/db'
import { getDictionary, type DictionaryKey } from './dictionaries'

/**
 * Locale + routing helpers. The locale is threaded as a prop through the server-component
 * tree (no React context needed for RSC); these helpers keep the call sites type-safe and
 * the URL rules in one place so middleware and components agree.
 *
 * Function-valued dictionary keys (reading time, copyright year) are called directly on the
 * dictionary object rather than via a helper, so their argument types stay narrow.
 */

export const LOCALES = ['ne', 'en'] as const
export const DEFAULT_LOCALE: Locale = 'ne'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

export const LOCALE_LABEL = {
  ne: 'नेपाली',
  en: 'English',
} as const

/** Coerce an unknown path segment into a supported locale, falling back to ne (Task 1.9). */
export function asLocale(value: string | undefined): Locale {
  return value === 'en' ? 'en' : 'ne'
}

/** `true` when the locale is the default, i.e. it lives at the site root (no /ne prefix). */
export function isDefaultLocale(locale: Locale): boolean {
  return locale === DEFAULT_LOCALE
}

/**
 * Build the localized URL path prefix for a locale.
 * ne is served from the root (clean URLs); en is served from /en/* (ADR-007).
 */
export function localePrefix(locale: Locale): string {
  return isDefaultLocale(locale) ? '' : '/en'
}

/** Resolve a reader-facing string for a locale by key. */
export function t(locale: Locale, key: DictionaryKey): string {
  const dict = getDictionary(locale)
  const value = dict[key]
  return typeof value === 'string' ? value : ''
}

/**
 * Localize an internal href. `/politics/x` stays at `/politics/x` for ne, becomes
 * `/en/politics/x` for en. A `path` of `/` maps to `/` or `/en`.
 */
export function localizeHref(locale: Locale, path: string): string {
  const prefix = localePrefix(locale)
  if (path === '/') return prefix ? `${prefix}/` : '/'
  const normalized = path.startsWith('/') ? path : `/${path}`
  let href = `${prefix}${normalized}`
  // Keep query/hash intact; otherwise match trailingSlash static export.
  const hashIdx = href.indexOf('#')
  const queryIdx = href.indexOf('?')
  const cut =
    hashIdx >= 0 && queryIdx >= 0 ? Math.min(hashIdx, queryIdx) : hashIdx >= 0 ? hashIdx : queryIdx
  if (cut >= 0) {
    const base = href.slice(0, cut)
    const rest = href.slice(cut)
    return `${base.endsWith('/') ? base : `${base}/`}${rest}`
  }
  return href.endsWith('/') ? href : `${href}/`
}

/**
 * Build the localized URL for the *opposite* locale from a pathname, preserving the page
 * tail (used by the locale toggle). `/politics/budget` ↔ `/en/politics/budget`, `/` ↔ `/en`,
 * `/en/author/x` ↔ `/author/x`. The masthead passes `usePathname()` so the reader lands on
 * the same content in the other language rather than always being sent to the home page.
 */
export function swapLocale(pathname: string): string {
  // Middleware may expose the default locale as an internal `/ne` prefix; never
  // treat that as part of the public URL or we create `/en/ne/...` 404s.
  let path = pathname || '/'
  if (path === '/ne' || path.startsWith('/ne/')) {
    path = path.slice(3) || '/'
  }
  const isEn = path === '/en' || path.startsWith('/en/')
  const rest = isEn ? path.slice(3) || '/' : path
  const clean = rest.replace(/\/+$/, '') || '/'
  return isEn ? localizeHref('ne', clean) : localizeHref('en', clean)
}

/** Compare pathnames ignoring trailing slashes (static export uses trailingSlash). */
export function pathsMatch(pathname: string, href: string): boolean {
  const a = pathname.replace(/\/+$/, '') || '/'
  const b = href.replace(/\/+$/, '') || '/'
  if (a === b) return true
  if (b === '/' || b === '/en') return a === b
  return a.startsWith(`${b}/`)
}
