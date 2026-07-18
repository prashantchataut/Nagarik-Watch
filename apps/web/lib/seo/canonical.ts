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

export function canonicalAlternates(locale: Locale, path: string): Metadata['alternates'] {
  const cleanPath = cleanCanonicalPath(path)
  return {
    canonical: localizeHref(locale, cleanPath),
    languages: {
      'ne-NP': localizeHref('ne', cleanPath),
      en: localizeHref('en', cleanPath),
      'x-default': localizeHref('ne', cleanPath),
    },
  }
}
