import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'

/**
 * AdSlot — a reserved-size, labelled ad container. The slot's dimensions are
 * fixed up front (via the `variant` map) so filling it later can never cause
 * layout shift — the SPEC.md CLS budget depends on this. The label is
 * reader-facing (ADR-006): every slot announces itself as an ad.
 *
 * Server component: no JS. When the ad manager (/admin/ads) wires a real
 * network (AdSense / GAM), the fill happens client-side into this shell; the
 * shell, label, and reserved size do not change.
 */
const SIZES = {
  leaderboard: { w: 728, h: 90, minH: 'min-h-[90px]' },
  rectangle: { w: 300, h: 250, minH: 'min-h-[250px]' },
  skyscraper: { w: 300, h: 600, minH: 'min-h-[600px]' },
  mobile: { w: 320, h: 50, minH: 'min-h-[50px]' },
} as const

type AdVariant = keyof typeof SIZES

export function AdSlot({
  variant = 'rectangle',
  locale,
  className = '',
  placementKey,
}: {
  variant?: AdVariant
  locale: Locale
  className?: string
  /** Stable key the ad manager uses to target this slot. */
  placementKey?: string
}) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const size = SIZES[variant]

  return (
    <aside
      className={`ad-slot flex flex-col items-center justify-center gap-2 p-4 ${size.minH} ${className}`}
      aria-label={dict.adLabel}
      lang={lang}
      data-placement={placementKey}
    >
      <span className="text-caption uppercase tracking-wide text-ink-soft">{dict.adLabel}</span>
      <span className="text-caption text-mute" lang="en">
        {size.w} × {size.h}
      </span>
    </aside>
  )
}
