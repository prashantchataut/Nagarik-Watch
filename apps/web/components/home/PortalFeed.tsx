import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { MegaStoryBlock } from '@/components/home/MegaStoryBlock'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type PortalFeedProps = {
  stories: StoryCardData[]
  locale: Locale
}

/**
 * Top-of-edition pack: 1–3 centered mega leads, then a dense dual row for
 * remaining picks so the fold does not become five identical towers.
 */
export function PortalFeed({ stories, locale }: PortalFeedProps) {
  const english = locale === 'en'
  const leads = stories.slice(0, 3)
  const more = stories.slice(3, 5)
  if (leads.length === 0) return null

  return (
    <section
      className="border-b border-rule pb-5 sm:pb-6"
      aria-label={english ? 'Front page' : 'मुख्य पृष्ठ'}
    >
      <div className="divide-y divide-rule">
        {leads.map((story, index) => (
          <div key={story.id} className={index === 0 ? 'pb-5 sm:pb-6' : 'py-5 sm:py-6'}>
            <InstrumentedStory
              articleSlug={story.slug}
              articleCategory={story.category.slug}
            >
              <MegaStoryBlock
                story={story}
                locale={locale}
                priority={index === 0}
                size={index === 0 ? 'lead' : 'standard'}
              />
            </InstrumentedStory>
          </div>
        ))}
      </div>

      {more.length > 0 ? (
        <ol
          className={`mt-1 grid gap-0 border-t border-rule ${
            more.length > 1 ? 'sm:grid-cols-2 sm:gap-x-5' : ''
          }`}
        >
          {more.map((story) => (
            <li key={story.id} className="border-b border-rule py-3 sm:border-b-0 sm:py-3.5">
              <InstrumentedStory
                articleSlug={story.slug}
                articleCategory={story.category.slug}
              >
                <DenseStoryItem
                  story={story}
                  locale={locale}
                  thumb="md"
                  showDeck
                  className="text-left"
                />
              </InstrumentedStory>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}
