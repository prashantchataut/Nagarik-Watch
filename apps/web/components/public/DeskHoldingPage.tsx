import Link from 'next/link'
import Image from 'next/image'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

type DeskHoldingPageProps = {
  locale: Locale
  /** Desk label shown as kicker (e.g. सम्पादकको रोजाइ). */
  kicker: string
  /** Honest one-line note about why the desk is light. */
  note: string
  /** Evergreen stories from sibling desks that fill the page. */
  fallbackStories: StoryCardData[]
  /** Label for the fallback band. */
  fallbackLabel: string
  ctaHref?: string
  ctaLabel?: string
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

/**
 * Composed holding page for light desks (plan system 1.2). A desk with no
 * inventory still renders an editor note plus evergreen sibling stories —
 * never a bare sentence above a void.
 */
export function DeskHoldingPage({
  locale,
  kicker,
  note,
  fallbackStories,
  fallbackLabel,
  ctaHref,
  ctaLabel,
}: DeskHoldingPageProps) {
  const en = locale === 'en'
  const picks = fallbackStories.slice(0, 6)

  return (
    <div className="mt-6">
      <section className="border-y border-rule py-7 text-center" aria-label={kicker}>
        <p className="text-caption font-bold uppercase tracking-[0.12em] text-brand-strong">{kicker}</p>
        <p className="mx-auto mt-2 max-w-[60ch] text-body-lg leading-relaxed text-ink-soft" lang={en ? 'en' : 'ne'}>
          {note}
        </p>
        {ctaHref && ctaLabel ? (
          <Link
            href={ctaHref}
            className="mt-4 inline-flex border-b border-brand pb-0.5 text-meta font-bold text-brand-strong hover:text-ink"
            lang={en ? 'en' : 'ne'}
          >
            {ctaLabel} →
          </Link>
        ) : null}
      </section>

      {picks.length > 0 ? (
        <section className="mt-8" aria-label={fallbackLabel}>
          <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-2.5">
            <h2 className="font-display text-h3 font-extrabold text-ink" lang={en ? 'en' : 'ne'}>
              {fallbackLabel}
            </h2>
            <Link
              href={localizeHref(locale, '/latest')}
              className="text-caption font-bold text-brand-strong hover:underline"
              lang={en ? 'en' : 'ne'}
            >
              {en ? 'All latest →' : 'सबै ताजा →'}
            </Link>
          </div>
          <div className="mt-4 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((story) => (
              <InstrumentedStory
                key={story.id}
                articleSlug={story.slug}
                articleCategory={story.category.slug}
              >
                <article className="group min-w-0">
                  {hasPhoto(story) ? (
                    <Link
                      href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
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
                  <p className="mt-2 text-caption font-bold text-brand-strong">
                    {en && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-pretty font-display text-body font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                    <Link
                      href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                      lang={en && story.titleEn ? 'en' : 'ne'}
                    >
                      {titleFor(story, locale)}
                    </Link>
                  </h3>
                  <Dateline iso={story.publishedAt} locale={locale} className="mt-1 block text-caption text-mute" />
                </article>
              </InstrumentedStory>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
