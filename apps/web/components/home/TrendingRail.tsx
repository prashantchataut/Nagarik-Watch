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

/** Compact numbered trending list for the homepage rail (velocity lens). */
export function TrendingRail({
  locale,
  stories,
  className,
  headingId = 'trending-rail-title',
  live = true,
}: {
  locale: Locale
  stories: StoryCardData[]
  className?: string
  headingId?: string
  live?: boolean
}) {
  if (stories.length === 0) return null
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <section className={className} aria-labelledby={headingId} lang={lang}>
      <div className="mb-2.5">
        <h2 id={headingId} className="font-display text-h3 font-extrabold text-ink">
          {en ? 'Trending' : 'ट्रेन्डिङ'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        {!live ? (
          <p className="mt-1.5 text-caption text-mute">
            {en ? 'Not enough signal yet · showing recent' : 'अझै पर्याप्त संकेत छैन · ताजा क्रम'}
          </p>
        ) : null}
      </div>
      <ol className="divide-y divide-rule border-y border-rule">
        {stories.slice(0, 6).map((story, index) => (
          <li key={story.id} className="py-2.5">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem
                story={story}
                locale={locale}
                rank={toNeDigits(index + 1, locale)}
                showMeta={false}
                showDeck={false}
                showThumb={false}
                compact
              />
            </InstrumentedStory>
          </li>
        ))}
      </ol>
      <p className="pt-3">
        <Link
          href={localizeHref(locale, '/trending')}
          className="inline-flex min-h-9 items-center text-meta font-bold text-brand-strong underline-offset-4 hover:underline"
        >
          {en ? 'Full list' : 'पूर्ण सूची'}
        </Link>
      </p>
    </section>
  )
}
