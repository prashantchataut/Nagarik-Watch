import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type LatestRailProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
  compact?: boolean
  headingId?: string
}

export function LatestRail({
  stories,
  locale,
  className,
  compact = false,
  headingId = 'latest-rail-title',
}: LatestRailProps) {
  const items = stories.slice(0, compact ? 5 : 5)
  if (items.length === 0) return null
  const english = locale === 'en'
  const lead = items[0]!
  const briefs = items.slice(1)

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

      {compact ? (
        <ol className="mt-1 divide-y divide-rule">
          {items.map((story) => (
            <li key={story.id} className="py-2.5">
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <DenseStoryItem
                  story={story}
                  locale={locale}
                  compact
                  showDeck
                  showDateline={false}
                  thumb="sm"
                />
              </InstrumentedStory>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-1">
          <div className="py-3">
            <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
              <DenseStoryItem story={lead} locale={locale} showDeck showDateline thumb="lg" />
            </InstrumentedStory>
          </div>
          {briefs.length > 0 ? (
            <ol className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
              {briefs.map((story, index) => (
                <li
                  key={story.id}
                  className={`min-w-0 py-2.5 ${index % 2 === 1 ? 'border-l border-rule pl-3 sm:pl-4' : 'pr-3 sm:pr-4'} ${index >= 2 ? 'border-t border-rule lg:border-t-0' : ''} ${index > 0 ? 'lg:border-l lg:border-rule lg:pl-4' : ''}`}
                >
                  <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                    <DenseStoryItem
                      story={story}
                      locale={locale}
                      showDeck={false}
                      showThumb={false}
                      showDateline
                    />
                  </InstrumentedStory>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      )}
    </aside>
  )
}
