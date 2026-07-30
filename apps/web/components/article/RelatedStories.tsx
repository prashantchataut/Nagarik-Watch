import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'

type RelatedStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/** Editorial "read next" rail at the foot of articles. */
export function RelatedStories({ stories, locale, className }: RelatedStoriesProps) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  const [lead, ...rest] = stories
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <section className={className} aria-label={dict.relatedStories}>
      <div className="border-b border-rule pb-2">
        <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
          {locale === 'en' ? 'Read next' : 'अब के पढ्ने'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      </div>
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] lg:gap-5">
        {lead ? <DenseStoryItem story={lead} locale={locale} thumb="lg" showDeck /> : null}
        <ol className="divide-y divide-rule border-y border-rule">
          {rest.map((story) => (
            <li key={story.slug} className="py-2.5 first:pt-0 last:pb-0">
              <DenseStoryItem story={story} locale={locale} thumb="sm" showDeck={false} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
