import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type PortalFeedProps = {
  stories: StoryCardData[]
  locale: Locale
}

/**
 * Top-of-edition pack:
 * 1. Centered Lead Mega-Story Block (64px display Mukta, centered deck, 16:9 photo)
 * 2. Follow-on Centered Mega Story (or dual featured cards)
 * 3. 4-column dense pulse strip for breaking/top developments
 */
export function PortalFeed({ stories, locale }: PortalFeedProps) {
  const english = locale === 'en'
  if (stories.length === 0) return null

  const lead = stories[0]!
  const subLead = stories[1]
  const dualPicks = stories.slice(2, 4)
  const pulsePicks = stories.slice(4, 8)

  return (
    <section
      className="border-b border-rule pb-6 sm:pb-8"
      aria-label={english ? 'Top Stories' : 'मुख्य समाचार'}
    >
      {/* 1. Primary Mega Lead Story */}
      <div className="pb-6 sm:pb-8">
        <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
          <MegaStoryBlock story={lead} locale={locale} priority size="lead" />
        </InstrumentedStory>
      </div>

      {/* 2. Secondary Mega Story (if available) */}
      {subLead ? (
        <div className="border-t border-rule py-6 sm:py-7">
          <InstrumentedStory articleSlug={subLead.slug} articleCategory={subLead.category.slug}>
            <MegaStoryBlock story={subLead} locale={locale} size="standard" />
          </InstrumentedStory>
        </div>
      ) : null}

      {/* 3. Dual Featured Cards Row */}
      {dualPicks.length > 0 ? (
        <div className="grid gap-4 border-t border-rule pt-5 sm:grid-cols-2 sm:gap-6 sm:pt-6">
          {dualPicks.map((story) => (
            <div key={story.id} className="min-w-0">
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <DenseStoryItem
                  story={story}
                  locale={locale}
                  thumb="lg"
                  showDeck
                  showMeta
                  className="rounded-md border border-rule/70 bg-surface-raised/40 p-3 hover:border-brand hover:bg-surface-raised transition-all"
                />
              </InstrumentedStory>
            </div>
          ))}
        </div>
      ) : null}

      {/* 4. 4-Story Pulse Strip */}
      {pulsePicks.length > 0 ? (
        <div className="mt-5 border-t border-rule pt-4">
          <div className="sr-only">{english ? 'More top stories' : 'थप मुख्य समाचार'}</div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pulsePicks.map((story, index) => (
              <li
                key={story.id}
                className={`min-w-0 py-2 ${
                  index > 0 ? 'sm:border-l sm:border-rule sm:pl-3.5' : ''
                }`}
              >
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem
                    story={story}
                    locale={locale}
                    showDeck={false}
                    showThumb={false}
                    showMeta
                    compact
                  />
                </InstrumentedStory>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
