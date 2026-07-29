import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type FeaturedBandProps = {
  stories: StoryCardData[]
  locale: Locale
  variant?: 'duo' | 'trio'
  className?: string
}

/**
 * Mid-scroll featured band injected between category sections.
 */
export function FeaturedBand({
  stories,
  locale,
  variant = 'trio',
  className = '',
}: FeaturedBandProps) {
  const max = variant === 'duo' ? 2 : 3
  const items = stories.slice(0, max)
  if (items.length < 2) return null
  const english = locale === 'en'

  return (
    <section
      className={`border-y border-rule bg-surface-raised/40 py-4 ${className}`.trim()}
      aria-label={english ? 'Top stories' : 'मुख्य समाचार'}
    >
      <SectionHeader
        title={english ? 'Top stories' : 'मुख्य समाचार'}
        locale={locale}
        titleLang={english ? 'en' : 'ne'}
      />

      <ol
        className={`mt-3 grid gap-4 ${variant === 'duo' ? 'md:grid-cols-2' : 'md:grid-cols-3 md:gap-3'}`}
      >
        {items.map((story) => (
          <li key={story.id} className="min-w-0 border-t border-rule pt-3 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem story={story} locale={locale} thumb="md" />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
    </section>
  )
}
