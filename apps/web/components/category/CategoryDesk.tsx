import type { ReactNode } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Hero } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { CategoryMoreStories } from '@/components/category/CategoryMoreStories'

type CategoryDeskProps = {
  stories: StoryCardData[]
  locale: Locale
  /** Override the “more” section heading (topic / hub). */
  moreHeading?: { ne: string; en: string }
  /** Override the side-rail kicker. */
  sideKicker?: { ne: string; en: string }
  /** Optional mid-band (ads) between lead pack and more stories. */
  midSlot?: ReactNode
}

/**
 * Category / section / topic index packing: lead + side rail, then list/grid more.
 * Shared desk language across category, topic, and hub pages.
 */
export function CategoryDesk({
  stories,
  locale,
  moreHeading,
  sideKicker,
  midSlot,
}: CategoryDeskProps) {
  if (!stories.length) return null
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const [lead, ...rest] = stories
  if (!lead) return null
  const side = rest.slice(0, 4)
  const more = rest.slice(4)
  const sideLabel =
    sideKicker != null
      ? english
        ? sideKicker.en
        : sideKicker.ne
      : english
        ? 'Also in this section'
        : 'यस खण्डका अन्य'

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.75fr)] xl:items-start xl:gap-5">
        <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
          <Hero story={lead} locale={locale} />
        </InstrumentedStory>
        {side.length > 0 ? (
          <aside className="min-w-0 border-t border-rule pt-3 xl:border-t-0 xl:pl-5 xl:pt-0">
            <p className="mb-2 text-meta font-extrabold text-brand-strong" lang={lang}>
              {sideLabel}
            </p>
            <span className="mb-2 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            <ul className="divide-y divide-rule border-y border-rule">
              {side.map((story) => (
                <li key={story.id} className="py-2.5">
                  <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                    <DenseStoryItem story={story} locale={locale} showDeck={false} thumb="sm" />
                  </InstrumentedStory>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </section>

      {midSlot}

      <CategoryMoreStories stories={more} locale={locale} heading={moreHeading} />
    </div>
  )
}
