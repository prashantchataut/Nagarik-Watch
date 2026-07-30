import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type FeaturedBandProps = {
  stories: StoryCardData[]
  locale: Locale
  variant?: 'duo' | 'trio'
  /** Preceding category slug for aria context only. */
  categorySlug?: string
  className?: string
}

/**
 * Quiet mid-scroll editorial pack between category desks.
 * No competing “top stories” title: the lead and सम्पादकीय चयन already own primacy.
 */
export function FeaturedBand({
  stories,
  locale,
  variant = 'trio',
  categorySlug,
  className = '',
}: FeaturedBandProps) {
  const max = variant === 'duo' ? 2 : 3
  const items = stories.slice(0, max)
  if (items.length < 2) return null
  const english = locale === 'en'
  const label = english ? 'More picks' : 'थप चयन'

  return (
    <section
      className={`border-t border-rule pt-4 ${className}`.trim()}
      aria-label={categorySlug ? `${label} (${categorySlug})` : label}
    >
      <ol
        className={`grid gap-3 ${variant === 'duo' ? 'md:grid-cols-2' : 'md:grid-cols-3 md:gap-3'}`}
      >
        {items.map((story) => (
          <li key={story.id} className="min-w-0">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem story={story} locale={locale} thumb="md" showDeck={false} />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
    </section>
  )
}
