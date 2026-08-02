import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function cleanCanonicalPath(path: string): string {
  const url = new URL(path, 'https://canonical.invalid')
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  const query = url.searchParams.toString()
  return `${url.pathname}${query ? `?${query}` : ''}`
}

type CanonicalOptions = {
  /**
   * When false, do not advertise an English hreflang alternate.
   * Use for stories/pages that have no English edition (UI chrome alone is not enough).
   */
  hasEnglish?: boolean
}

export function canonicalAlternates(
  locale: Locale,
  path: string,
  options: CanonicalOptions = {},
): Metadata['alternates'] {
  const cleanPath = cleanCanonicalPath(path)
  const hasEnglish = options.hasEnglish !== false
  const languages: Record<string, string> = {
    'ne-NP': localizeHref('ne', cleanPath),
    'x-default': localizeHref('ne', cleanPath),
  }
  if (hasEnglish) {
    languages.en = localizeHref('en', cleanPath)
  }
  return {
    canonical: localizeHref(locale, cleanPath),
    languages,
  }
}
