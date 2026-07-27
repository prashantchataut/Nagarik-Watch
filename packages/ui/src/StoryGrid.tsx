import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from './StoryCard'
import { cn } from './cn'

type StoryGridProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
  /** When true, first card gets priority image loading. */
  priorityLead?: boolean
}

/**
 * Varied story layout — never an identical equal-card grid.
 * Lead + secondary row + compact text rail for the rest.
 */
export function StoryGrid({ stories, locale, className, priorityLead = true }: StoryGridProps) {
  if (!stories.length) return null

  const [lead, ...rest] = stories
  if (!lead) return null
  const secondary = rest.slice(0, 2)
  const compact = rest.slice(2)

  return (
    <div className={cn('grid gap-4 sm:gap-5', className)}>
      <div className="grid gap-4 border-b border-rule pb-4 sm:gap-5 sm:pb-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] lg:gap-6">
        <StoryCard story={lead} locale={locale} variant="lead" priority={priorityLead} className="lg:pr-4" />
        {secondary.length ? (
          <div className="grid content-start gap-3 border-t border-rule pt-4 lg:border-t-0 lg:border-l lg:border-rule lg:pt-0 lg:pl-5">
            {secondary.map((story) => (
              <StoryCard key={story.id} story={story} locale={locale} variant="horizontal" />
            ))}
          </div>
        ) : null}
      </div>
      {compact.length ? (
        <ul className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {compact.map((story) => (
            <li key={story.id} className="border-b border-rule py-3 sm:px-2 sm:first:pl-0">
              <StoryCard story={story} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
