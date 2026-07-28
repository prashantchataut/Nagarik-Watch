import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'

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

/** Shared numbered list for latest / trending / most-read — no mono ranks. */
export function RankedStoryList({ stories, locale, startRank = 1 }: RankedStoryListProps) {
  if (!stories.length) return null

  return (
    <ol className="mt-8 divide-y divide-rule border-y border-rule">
      {stories.map((story, index) => {
        return (
          <li
            key={story.id}
            className="grid gap-3 py-4 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-4 sm:py-5"
          >
            <span
              className="pt-0.5 font-display text-h2 font-extrabold tabular-nums text-brand-strong"
              aria-hidden="true"
            >
              {rankLabel(index, locale, startRank)}
            </span>
            <StoryCard story={story} locale={locale} variant="horizontal" />
          </li>
        )
      })}
    </ol>
  )
}
