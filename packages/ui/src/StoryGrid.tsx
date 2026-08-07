import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Hero } from './Hero'
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
 * Lead uses Hero (text then photo) so headline and image share one left edge;
 * secondary rail packs beside it; compact rows fill the rest.
 */
export function StoryGrid({ stories, locale, className, priorityLead = true }: StoryGridProps) {
  if (!stories.length) return null

  const [lead, ...rest] = stories
  if (!lead) return null
  const secondary = rest.slice(0, 4)
  const compact = rest.slice(4)

  return (
    <div className={cn('grid gap-5 sm:gap-6', className)}>
      <div className="grid gap-5 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.8fr)] xl:items-start xl:gap-6">
        <Hero story={lead} locale={locale} priority={priorityLead} />
        {secondary.length ? (
          <aside className="min-w-0 border-t border-rule pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
            <ul className="divide-y divide-rule border-y border-rule">
              {secondary.map((story) => (
                <li key={story.id} className="py-3">
                  <StoryCard story={story} locale={locale} variant="horizontal" />
                </li>
              ))}
            </ul>
          </aside>
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
