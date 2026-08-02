import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type LatestRailProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
  /** Sidebar: single-column, tighter packing for persistent desktop rail. */
  compact?: boolean
  /** Unique when the rail is rendered twice (mobile + desktop). */
  headingId?: string
}

/**
 * Dense “ताजा” feed: thumbnail + headline + short deck + meta.
 * Shares DenseStoryItem with featured / also-today rails.
 */
export function LatestRail({
  stories,
  locale,
  className,
  compact = false,
  headingId = 'latest-rail-title',
}: LatestRailProps) {
  const items = stories.slice(0, compact ? 5 : 8)
  if (items.length === 0) return null
  const english = locale === 'en'

  return (
    <aside className={className} aria-labelledby={headingId}>
      <div className="flex items-end justify-between gap-3 border-b border-rule pb-2">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-pretty font-display text-h3 font-extrabold text-ink"
            lang={english ? 'en' : 'ne'}
          >
            {english ? 'Latest' : 'ताजा'}
          </h2>
          <span className="mt-1 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
        <Link
          href={localizeHref(locale, '/latest')}
          className="mb-0.5 shrink-0 cursor-pointer text-meta font-bold text-brand-strong underline-offset-4 transition-colors duration-fast ease-out-quint hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={english ? 'en' : 'ne'}
        >
          {english ? 'All' : 'सबै'}
        </Link>
      </div>

      <ol className={`mt-1 grid gap-0 ${compact ? '' : 'sm:grid-cols-2 sm:gap-x-5'}`}>
        {items.map((story) => (
          <li key={story.id} className="border-b border-rule py-2.5 last:border-b-0">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem
                story={story}
                locale={locale}
                compact={compact}
                showDeck
                showDateline={!compact}
                thumb="sm"
              />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
    </aside>
  )
}
