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
  if (path === '/') return prefix || '/'
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${prefix}${normalized}`
}

/**
 * Convert a localized path back to the opposite locale (used by the locale toggle).
 * Preserves everything after the locale segment.
 */
export function swapLocale(pathname: string): string {
  const rest = pathname.startsWith('/en') ? pathname.slice(3) : pathname
  const targetRest = rest === '' ? '/' : rest
  return targetRest
}
