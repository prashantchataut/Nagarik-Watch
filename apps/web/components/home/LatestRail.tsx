import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

type LatestRailProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function isDataUrl(url: string): boolean {
  return url.startsWith('data:')
}

/**
 * Dense “ताजा” feed: thumbnail + headline + short deck + meta.
 * Headline-only numbered lists read as unfinished on a news portal.
 */
export function LatestRail({ stories, locale, className }: LatestRailProps) {
  const items = stories.slice(0, 8)
  if (items.length === 0) return null
  const english = locale === 'en'

  return (
    <aside className={className} aria-labelledby="latest-rail-title">
      <div className="flex items-end justify-between gap-3 border-b border-rule pb-2">
        <div className="min-w-0">
          <h2
            id="latest-rail-title"
            className="text-pretty font-display text-h3 font-extrabold text-ink"
            lang={english ? 'en' : 'ne'}
          >
            {english ? 'Latest' : 'ताजा'}
          </h2>
          <span className="mt-1 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
        <Link
          href={localizeHref(locale, '/latest')}
          className="mb-0.5 shrink-0 cursor-pointer text-meta font-bold text-brand-strong underline-offset-4 transition-colors duration-fast ease-out-quint hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={english ? 'en' : 'ne'}
        >
          {english ? 'All' : 'सबै'}
        </Link>
      </div>

      <ol className="mt-1 grid gap-0 sm:grid-cols-2 sm:gap-x-6">
        {items.map((story) => {
          const title = english && story.titleEn ? story.titleEn : story.titleNe
          const titleLang = english && story.titleEn ? 'en' : 'ne'
          const deck = deckFor(story, locale)
          const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
          const image = story.heroImage
          const unoptimized = image ? isDataUrl(image.url) : false

          return (
            <li key={story.id} className="border-b border-rule py-3">
              <article className="group grid grid-cols-[5.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[6.25rem_minmax(0,1fr)]">
                <Link
                  href={href}
                  className="relative aspect-[4/3] shrink-0 overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      unoptimized={unoptimized}
                      sizes="100px"
                      className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-brand-tint" />
                  )}
                </Link>

                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
                    <span className="font-bold text-brand-strong" lang={english ? 'en' : 'ne'}>
                      {english && story.category.nameEn
                        ? story.category.nameEn
                        : story.category.nameNe}
                    </span>
                    <span className="text-mute" aria-hidden="true">
                      ·
                    </span>
                    <Dateline iso={story.publishedAt} locale={locale} />
                  </div>

                  <h3 className="mt-1 font-display text-body font-bold leading-snug text-ink sm:text-body-lg">
                    <Link
                      href={href}
                      className="cursor-pointer transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      lang={titleLang}
                    >
                      <span className="line-clamp-2 text-pretty">{title}</span>
                    </Link>
                  </h3>

                  {deck ? (
                    <p
                      className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft sm:text-meta"
                      lang={titleLang}
                    >
                      {deck}
                    </p>
                  ) : null}
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
