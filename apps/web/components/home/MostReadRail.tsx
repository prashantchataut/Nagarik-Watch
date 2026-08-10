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
      <div className="flex items-center justify-between border-b-2 border-brand pb-2">
        <div className="flex items-center gap-2">
          <TrendingIcon />
          <h2 id={headingId} className="font-display text-h3 font-black text-ink">
            {en ? 'Trending & Most Read' : 'धेरै पढिएको'}
          </h2>
        </div>
        <Link
          href={localizeHref(locale, '/most-read')}
          className="shrink-0 text-caption font-bold text-brand-strong transition-colors duration-fast ease-out-quint hover:underline"
        >
          {en ? 'Top 10 →' : 'शीर्ष १० →'}
        </Link>
      </div>

      {!live ? (
        <p className="mt-1 text-[0.72rem] text-mute">
          {en ? 'Recent popular stories' : 'पछिल्ला लोकप्रिय समाचार'}
        </p>
      ) : null}

      <ol className="mt-1 divide-y divide-rule border-b border-rule">
        {stories.slice(0, 6).map((story, index) => (
          <li key={story.id} className="py-2.5">
            <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
              <DenseStoryItem
                story={story}
                locale={locale}
                rank={toNeDigits(index + 1, locale)}
                showMeta
                showDeck={false}
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

function TrendingIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-strong"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  )
}
