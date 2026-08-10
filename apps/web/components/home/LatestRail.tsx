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
  const items = stories.slice(0, compact ? 6 : 5)
  if (items.length === 0) return null
  const english = locale === 'en'
  const lead = items[0]!
  const briefs = items.slice(1)

  return (
    <aside className={className} aria-labelledby={headingId}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-brand pb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-strong" />
          </span>
          <h2
            id={headingId}
            className="text-pretty font-display text-h3 font-black text-ink"
            lang={english ? 'en' : 'ne'}
          >
            {english ? 'Live Updates' : 'ताजा अपडेट'}
          </h2>
        </div>
        <Link
          href={localizeHref(locale, '/latest')}
          className="shrink-0 text-caption font-bold text-brand-strong transition-colors duration-fast ease-out-quint hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={english ? 'en' : 'ne'}
        >
          {english ? 'All updates →' : 'सबै ताजा →'}
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
                  showDeck={false}
                  showDateline
                  showMeta
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
