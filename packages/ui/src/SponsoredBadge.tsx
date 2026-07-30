import type { Locale } from '@nagarikwatch/db'
import { cn } from './cn'

type SponsoredBadgeProps = {
  locale: Locale
  className?: string
}

/**
 * Unambiguous native/sponsored label. Never style this like editorial kickers.
 */
export function SponsoredBadge({ locale, className }: SponsoredBadgeProps) {
  const english = locale === 'en'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-rule bg-surface-raised px-1.5 py-0.5 text-caption font-bold text-ink-soft',
        className,
      )}
      lang={english ? 'en' : 'ne'}
    >
      {english ? 'Sponsored' : 'प्रायोजित'}
    </span>
  )
}
