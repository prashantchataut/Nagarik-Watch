import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Hero } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type CategoryDeskProps = {
  stories: StoryCardData[]
  locale: Locale
}

/**
 * Category / section index packing: lead + side rail, then dense thumb rows.
 * Matches homepage desk rhythm (not equal card grids).
 */
export function CategoryDesk({ stories, locale }: CategoryDeskProps) {
  if (!stories.length) return null
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const [lead, ...rest] = stories
  if (!lead) return null
  const side = rest.slice(0, 4)
  const more = rest.slice(4)

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.75fr)] xl:items-start xl:gap-5">
        <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
          <Hero story={lead} locale={locale} />
        </InstrumentedStory>
        {side.length > 0 ? (
          <aside className="min-w-0 border-t border-rule pt-3 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            <p className="mb-2 text-meta font-extrabold text-brand-strong" lang={lang}>
              {english ? 'Also in this section' : 'यस खण्डका अन्य'}
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

      {more.length > 0 ? (
        <section>
          <div className="border-b border-rule pb-2">
            <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
              {english ? 'More stories' : 'थप समाचार'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
          </div>
          <ul className="mt-2 divide-y divide-rule">
            {more.map((story) => (
              <li key={story.id} className="py-2.5">
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem story={story} locale={locale} thumb="md" showDeck />
                </InstrumentedStory>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
