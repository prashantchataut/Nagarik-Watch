import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'

/**
 * One-line date rendering for a card or byline. Delegates to the shared formatDate util so
 * BS dates + Devanagari numerals come for free in ne and Gregorian in en. Renders a <time>
 * element with the machine-readable ISO for assistive tech and SEO.
 */
type DatelineProps = {
  iso: string
  locale: Locale
  className?: string
}

export function Dateline({ iso, locale, className }: DatelineProps) {
  const label = formatDate(iso, locale)
  if (!label) return null
  return (
    <time dateTime={iso} lang={locale === 'en' ? 'en' : 'ne'} className={className}>
      {label}
    </time>
  )
}
