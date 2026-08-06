import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type RelatedStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/** Portal-style related strip: thumb + headline grid under the article. */
export function RelatedStories({ stories, locale, className }: RelatedStoriesProps) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <section className={className} aria-label={dict.relatedStories}>
      <div className="border-b border-rule pb-2">
        <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
          {locale === 'en' ? 'Read next' : 'अब के पढ्ने'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      </div>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {stories.slice(0, 6).map((story) => (
          <li key={story.slug} className="min-w-0 border-b border-rule pb-3 last:border-b-0 sm:border-b-0 sm:pb-0">
            <DenseStoryItem story={story} locale={locale} thumb="md" showDeck={false} />
          </li>
        ))}
      </ul>
    </section>
  )
}
