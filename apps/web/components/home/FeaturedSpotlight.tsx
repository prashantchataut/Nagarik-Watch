import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type FeaturedSpotlightProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/**
 * Top featured grid below the hero: editorial picks in a dense 2–4 column pack.
 */
export function FeaturedSpotlight({ stories, locale, className = '' }: FeaturedSpotlightProps) {
  const items = stories.slice(0, 4)
  if (items.length < 2) return null
  const english = locale === 'en'

  return (
    <section
      className={`border-b border-rule pb-4 pt-1 sm:pb-5 ${className}`.trim()}
      aria-labelledby="featured-spotlight-title"
    >
      <SectionHeader
        id="featured-spotlight-title"
        title={english ? "Editor's picks" : 'सम्पादकीय चयन'}
        locale={locale}
        titleLang={english ? 'en' : 'ne'}
      />

      <ol className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {items.map((story, index) => (
          <li
            key={story.id}
            className={`min-w-0 ${index === 0 && items.length >= 3 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
          >
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem
                story={story}
                locale={locale}
                thumb={index === 0 ? 'lg' : 'md'}
                className={index === 0 ? 'lg:grid-cols-[9rem_minmax(0,1fr)]' : ''}
              />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
    </section>
  )
}
