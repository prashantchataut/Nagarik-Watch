import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { SectionHeader, StoryCard } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'

type RelatedStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/**
 * End-of-article related rail. Renders a section header from the dictionary and a default
 * card grid of 3–4 same-category picks. Empty input renders nothing so the page does not
 * show an orphan heading.
 */
export function RelatedStories({ stories, locale, className }: RelatedStoriesProps) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  return (
    <section className={className} aria-label={dict.relatedStories}>
      <SectionHeader title={dict.relatedStories} locale={locale} />
      <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s) => (
          <li key={s.slug}>
            <StoryCard story={s} locale={locale} variant="default" />
          </li>
        ))}
      </ul>
    </section>
  )
}
