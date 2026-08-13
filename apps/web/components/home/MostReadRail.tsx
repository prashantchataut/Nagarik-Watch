import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

const NE = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function toNeDigits(n: number, locale: Locale): string {
  if (locale !== 'ne') return String(n)
  return String(n).replace(/[0-9]/g, (d) => NE[Number(d)] ?? d)
}

/** Compact numbered most-read list for the homepage rail. */
export function MostReadRail({
  locale,
  stories,
  className,
  headingId = 'most-read-title',
  live = true,
}: {
  locale: Locale
  stories: StoryCardData[]
  className?: string
  headingId?: string
  /** False when rail falls back to recent catalog (thin engagement). */
  live?: boolean
}) {
  if (stories.length === 0) return null
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <section className={className} aria-labelledby={headingId} lang={lang}>
      <div className="flex items-end justify-between gap-3 border-b border-rule pb-2">
        <div className="min-w-0">
          <h2 id={headingId} className="font-display text-h3 font-extrabold text-ink">
            {en ? 'Most read' : 'धेरै पढिएको'}
          </h2>
          <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
        <Link
          href={localizeHref(locale, '/most-read')}
          className="mb-0.5 shrink-0 text-caption font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {en ? 'Top 10' : 'शीर्ष १०'}
          <span aria-hidden="true"> →</span>
        </Link>
      </div>

      {!live ? (
        <p className="mt-2 text-caption text-mute">
          {en ? 'Recent popular stories' : 'पछिल्ला लोकप्रिय समाचार'}
        </p>
      ) : null}

      <ol className="divide-y divide-rule border-b border-rule">
        {stories.slice(0, 6).map((story, index) => (
          <li key={story.id} className="py-2.5">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem
                story={story}
                locale={locale}
                rank={toNeDigits(index + 1, locale)}
                showMeta
                showDeck
                thumb="sm"
                compact
              />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
    </section>
  )
}
