import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { cn } from '@nagarikwatch/ui'

type BreakingTickerProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/**
 * Breaking-news ticker. Renders only when there are isBreaking stories.
 * The label sits pinned on the left with a pulsing dot (the "live"
 * affordance); items scroll horizontally via the CSS marquee in globals.css.
 * Hover or keyboard focus pauses the scroll; under reduced-motion the items
 * stack statically.
 *
 * Each headline is a real link to its article, so the ticker is keyboard-
 * navigable and contributes to the document, not a decorative strip.
 */
export function BreakingTicker({ stories, locale, className }: BreakingTickerProps) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  const label = dict.breakingLabel

  const items = stories.map((s) => {
    const title = locale === 'en' && s.titleEn ? s.titleEn : s.titleNe
    const href = localizeHref(locale, `/${s.category.slug}/${s.slug}`)
    return { slug: s.slug, title, href, lang: locale === 'en' && s.titleEn ? 'en' : 'ne' }
  })

  const loop = [...items, ...items]

  return (
    <div
      className={cn(
        'ticker-host flex items-stretch border-b border-breaking/30 bg-breaking text-surface',
        className,
      )}
      role="region"
      aria-label={label}
    >
      <span
        className="z-10 flex shrink-0 items-center gap-2 bg-breaking px-4 py-2 text-meta font-bold uppercase tracking-wide text-surface"
        lang={locale === 'en' ? 'en' : 'ne'}
      >
        {/* Pulsing live dot — the "this is happening now" affordance. */}
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-surface" />
        </span>
        {label}
      </span>
      <div className="relative flex-1 overflow-hidden">
        <ul className="ticker-track py-2">
          {loop.map((item, i) => (
            <li key={`${item.slug}-${i}`} className="mx-4 inline-flex items-center">
              <span aria-hidden="true" className="mr-2 text-surface/50">
                •
              </span>
              <Link
                href={item.href}
                className="text-meta font-medium text-surface transition-opacity duration-fast ease-out-quint hover:opacity-80"
                lang={item.lang}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
