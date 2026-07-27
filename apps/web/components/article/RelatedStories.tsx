import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'

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
      <div className="border-b border-rule pb-3">
        <h2 className="font-display text-h3 font-extrabold text-ink sm:text-h2" lang={lang}>
          {locale === 'en' ? 'Read next' : 'अब के पढ्ने'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <p className="mt-2 max-w-[42rem] text-meta leading-relaxed text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'Matched by section, headline overlap, and freshness.'
            : 'विभाग, शीर्षक मिलान र ताजापनका आधारमा छानिएको।'}
        </p>
      </div>
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] lg:gap-8">
        {lead ? <StoryCard story={lead} locale={locale} variant="featured" /> : null}
        <ol className="divide-y divide-rule border-y border-rule">
          {rest.map((story) => (
            <li key={story.slug} className="py-3 first:pt-0 last:pb-0">
              <StoryCard story={story} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
