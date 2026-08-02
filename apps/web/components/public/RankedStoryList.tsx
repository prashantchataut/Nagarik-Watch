import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type RankedStoryListProps = {
  stories: StoryCardData[]
  locale: Locale
  /** Visual framing hint for aria / empty copy differentiation. */
  mode?: 'latest' | 'trending' | 'most-read'
  startRank?: number
}

function rankLabel(index: number, locale: Locale, startRank = 1): string {
  const n = startRank + index
  if (locale === 'en') return String(n)
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(n)
    .split('')
    .map((d) => digits[Number(d)] ?? d)
    .join('')
}

/**
 * Shared numbered list for latest / trending / most-read.
 * DenseStoryItem keeps hub indexes packed like the homepage rails.
 */
export function RankedStoryList({ stories, locale, startRank = 1 }: RankedStoryListProps) {
  if (!stories.length) return null

  return (
    <ol className="mt-3 divide-y divide-rule border-y border-rule sm:mt-4">
      {stories.map((story, index) => (
        <li key={story.id} className="py-2.5 sm:py-3">
          <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
            <DenseStoryItem
              story={story}
              locale={locale}
              rank={rankLabel(index, locale, startRank)}
              thumb="md"
              showDeck
              showMeta
            />
          </InstrumentedStory>
        </li>
      ))}
    </ol>
  )
}
