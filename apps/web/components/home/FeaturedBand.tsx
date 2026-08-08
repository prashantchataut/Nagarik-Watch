import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type FeaturedBandProps = {
  stories: StoryCardData[]
  locale: Locale
  variant?: 'duo' | 'trio' | 'asymmetric'
  /** Preceding category slug for aria context only. */
  categorySlug?: string
  className?: string
}

/**
 * Quiet mid-scroll editorial pack between category desks.
 * Asymmetric 1+2 is the dense portal default; equal trios are avoided.
 */
export function FeaturedBand({
  stories,
  locale,
  variant = 'asymmetric',
  categorySlug,
  className = '',
}: FeaturedBandProps) {
  const max = variant === 'duo' ? 2 : 3
  const items = stories.slice(0, max)
  if (items.length < 2) return null
  const english = locale === 'en'
  const label = english ? 'More picks' : 'थप चयन'
  const [lead, ...rest] = items
  const asymmetric = variant === 'asymmetric' && items.length >= 3 && lead

  return (
    <section
      className={`border-t border-rule pt-3.5 pb-1 ${className}`.trim()}
      aria-label={categorySlug ? `${label} (${categorySlug})` : label}
    >
      {asymmetric ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:gap-4">
          <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
            <DenseStoryItem story={lead} locale={locale} thumb="md" showDeck />
          </InstrumentedStory>
          <ol className="flex min-w-0 flex-col divide-y divide-rule border-y border-rule md:border-t-0">
            {rest.slice(0, 2).map((story) => (
              <li key={story.id} className="py-2.5 first:pt-0 last:pb-0">
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <DenseStoryItem story={story} locale={locale} thumb="sm" showDeck={false} compact />
                </InstrumentedStory>
              </li>
            ))}
          </ol>
        </div>
      ) : (
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
      )}
    </section>
  )
}
