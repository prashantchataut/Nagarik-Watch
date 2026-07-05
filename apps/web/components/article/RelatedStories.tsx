import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'

type RelatedStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

export function RelatedStories({ stories, locale, className }: RelatedStoriesProps) {
  if (stories.length === 0) return null
  const dict = getDictionary(locale)
  const [lead, ...rest] = stories
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <section className={className} aria-label={dict.relatedStories}>
      <div className="border-b border-rule pb-3">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
          Recommendation desk
        </p>
        <h2 className="mt-1 font-display text-h1 font-extrabold text-ink" lang={lang}>
          {locale === 'en' ? 'Read next' : 'अब के पढ्ने'}
        </h2>
        <p className="mt-1 max-w-body text-meta text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'Picked by category match, title similarity and freshness. Sponsored items are penalised.'
            : 'विभाग, शीर्षक समानता र ताजापनका आधारमा छानिएको। प्रायोजित सामग्रीलाई तल राखिन्छ।'}
        </p>
      </div>
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
        {lead ? <StoryCard story={lead} locale={locale} variant="featured" /> : null}
        <ol className="divide-y divide-rule border-y border-rule">
          {rest.map((story, index) => (
            <li key={story.slug} className="grid grid-cols-[2.25rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
              <span className="pt-1 font-mono text-caption font-bold text-mute">{String(index + 1).padStart(2, '0')}</span>
              <StoryCard story={story} locale={locale} variant="text-led" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
