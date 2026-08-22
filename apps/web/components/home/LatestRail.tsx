import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
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
  const items = stories.slice(0, compact ? 8 : 6)
  if (items.length === 0) return null
  const english = locale === 'en'
  const lead = items[0]!
  const briefs = items.slice(1)

  return (
    <aside className={className} aria-labelledby={headingId}>
      <SectionHeader
        id={headingId}
        title={english ? 'Latest' : 'ताजा अपडेट'}
        locale={locale}
        href={localizeHref(locale, '/latest')}
        moreLabel={english ? 'All updates' : 'सबै ताजा'}
      />

      {compact ? (
        <ol className="mt-3.5 space-y-3">
          {items.map((story, index) => (
            <li key={story.id} className="grid min-w-0 grid-cols-[1.45rem_minmax(0,1fr)] gap-2.5">
              <span
                className="pt-0.5 font-sans text-caption font-black tabular-nums text-brand-strong"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
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
        <div className="mt-4">
          <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
            <DenseStoryItem story={lead} locale={locale} showDeck showDateline thumb="lg" />
          </InstrumentedStory>
          {briefs.length > 0 ? (
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {briefs.map((story, index) => (
                <li
                  key={story.id}
                  className="grid min-w-0 grid-cols-[1.45rem_minmax(0,1fr)] gap-2.5"
                >
                  <span
                    className="pt-0.5 font-sans text-caption font-black tabular-nums text-brand-strong"
                    aria-hidden="true"
                  >
                    {String(index + 2).padStart(2, '0')}
                  </span>
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
          ) : null}
        </div>
      )}
    </aside>
  )
}
