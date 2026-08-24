import Link from 'next/link'
import Image from 'next/image'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

export type StoryIndexMode = 'latest' | 'trending' | 'most-read'

type StoryIndexCompositionProps = {
  stories: StoryCardData[]
  locale: Locale
  mode: StoryIndexMode
  startRank?: number
}

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function rankLabel(index: number, locale: Locale, startRank: number): string {
  const n = startRank + index
  if (locale === 'en') return String(n).padStart(2, '0')
  return String(n)
    .padStart(2, '0')
    .split('')
    .map((d) => DEVANAGARI_DIGITS[Number(d)] ?? d)
    .join('')
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function hrefFor(story: StoryCardData, locale: Locale): string {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

function RankChip({ children }: { children: string }) {
  return (
    <span
      className="inline-flex min-w-[2rem] items-center justify-center border border-brand/25 bg-brand/10 px-1.5 py-0.5 text-caption font-black tabular-nums text-brand-strong"
      aria-hidden="true"
    >
      {children}
    </span>
  )
}

function Kicker({ story, locale }: { story: StoryCardData; locale: Locale }) {
  return (
    <p className="text-caption font-bold text-brand-strong">
      {locale === 'en' && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
    </p>
  )
}

/**
 * Shared listing family for latest / trending / most-read.
 * Four zones, one card anatomy, continuous ranking:
 *   lead package -> secondary trio -> mosaic -> compact tail.
 * Replaces the single-column numbered-row template.
 */
export function StoryIndexComposition({
  stories,
  locale,
  startRank = 1,
}: StoryIndexCompositionProps) {
  if (stories.length === 0) return null

  const lead = stories[0]!
  const secondary = stories.slice(1, 4)
  const mosaic = stories.slice(4, 10)
  const tail = stories.slice(10)
  const leadHref = hrefFor(lead, locale)

  return (
    <div className="mt-4">
      {/* Zone 1 — lead package */}
      <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
        <article className="group grid min-w-0 gap-4 border-b border-rule pb-5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:gap-6">
          {hasPhoto(lead) ? (
            <Link
              href={leadHref}
              className="relative block aspect-[16/10] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              tabIndex={-1}
              aria-hidden="true"
            >
              <Image
                src={lead.heroImage!.url}
                alt={lead.heroImage!.alt || titleFor(lead, locale)}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.012]"
              />
            </Link>
          ) : null}
          <div className="min-w-0 sm:py-1">
            <div className="flex items-center gap-2">
              <RankChip>{rankLabel(0, locale, startRank)}</RankChip>
              <Kicker story={lead} locale={locale} />
            </div>
            <h2 className="mt-2 text-pretty font-display text-[clamp(1.5rem,2.6vw,2.1rem)] font-black leading-[1.22] text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong">
              <Link href={leadHref} lang={locale === 'en' && lead.titleEn ? 'en' : 'ne'}>
                {titleFor(lead, locale)}
              </Link>
            </h2>
            {deckFor(lead, locale) ? (
              <p
                className="mt-2 line-clamp-3 text-body leading-relaxed text-ink-soft"
                lang={locale === 'en' && lead.deckEn ? 'en' : 'ne'}
              >
                {deckFor(lead, locale)}
              </p>
            ) : null}
            <Dateline iso={lead.publishedAt} locale={locale} className="mt-2.5 block text-caption text-mute" />
          </div>
        </article>
      </InstrumentedStory>

      {/* Zone 2 — secondary trio */}
      {secondary.length > 0 ? (
        <div className="grid gap-x-5 gap-y-5 border-b border-rule py-5 sm:grid-cols-3">
          {secondary.map((story, index) => (
            <InstrumentedStory
              key={story.id}
              articleSlug={story.slug}
              articleCategory={story.category.slug}
            >
              <article className="group min-w-0">
                <div className="flex items-center gap-2">
                  <RankChip>{rankLabel(index + 1, locale, startRank)}</RankChip>
                  <Kicker story={story} locale={locale} />
                </div>
                {hasPhoto(story) ? (
                  <Link
                    href={hrefFor(story, locale)}
                    className="relative mt-2 block aspect-[16/9] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={story.heroImage!.url}
                      alt={story.heroImage!.alt || titleFor(story, locale)}
                      fill
                      sizes="(min-width: 1024px) 25vw, 100vw"
                      className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
                    />
                  </Link>
                ) : null}
                <h3 className="mt-2 text-pretty font-display text-[1.12rem] font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                  <Link href={hrefFor(story, locale)} lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}>
                    {titleFor(story, locale)}
                  </Link>
                </h3>
                <Dateline iso={story.publishedAt} locale={locale} className="mt-1.5 block text-caption text-mute" />
              </article>
            </InstrumentedStory>
          ))}
        </div>
      ) : null}

      {/* Zone 3 — mosaic */}
      {mosaic.length > 0 ? (
        <div className="border-b border-rule py-5">
          <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {mosaic.map((story, index) => (
              <InstrumentedStory
                key={story.id}
                articleSlug={story.slug}
                articleCategory={story.category.slug}
              >
                <article className="group min-w-0">
                  {hasPhoto(story) ? (
                    <Link
                      href={hrefFor(story, locale)}
                      className="relative block aspect-[3/2] w-full overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      <Image
                        src={story.heroImage!.url}
                        alt={story.heroImage!.alt || titleFor(story, locale)}
                        fill
                        sizes="(min-width: 1024px) 25vw, 100vw"
                        className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
                      />
                    </Link>
                  ) : null}
                  <div className="mt-2 flex items-center gap-2">
                    <RankChip>{rankLabel(index + 4, locale, startRank)}</RankChip>
                    <Kicker story={story} locale={locale} />
                  </div>
                  <h3 className="mt-1.5 line-clamp-2 text-pretty font-display text-body font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                    <Link href={hrefFor(story, locale)} lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}>
                      {titleFor(story, locale)}
                    </Link>
                  </h3>
                  <Dateline iso={story.publishedAt} locale={locale} className="mt-1 block text-caption text-mute" />
                </article>
              </InstrumentedStory>
            ))}
          </div>
        </div>
      ) : null}

      {/* Zone 4 — compact tail */}
      {tail.length > 0 ? (
        <ol className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {tail.map((story, index) => (
            <li key={story.id} className="min-w-0">
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <DenseStoryItem
                  story={story}
                  locale={locale}
                  rank={rankLabel(index + 10, locale, startRank)}
                  thumb="sm"
                  showDeck={false}
                  showMeta
                  compact
                />
              </InstrumentedStory>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
