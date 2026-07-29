import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

export type DenseStoryItemProps = {
  story: StoryCardData
  locale: Locale
  /** Show deck line under headline. */
  showDeck?: boolean
  /** Show category + dateline meta row. */
  showMeta?: boolean
  /** When false, hide dateline but keep category. */
  showDateline?: boolean
  /** Optional rank numeral (most-read, brief). */
  rank?: number | string
  /** Tighter type for sticky sidebar rails. */
  compact?: boolean
  /** Force thumbnail off (text-led lists). */
  showThumb?: boolean
  /** Thumb column width preset. */
  thumb?: 'sm' | 'md' | 'lg'
  className?: string
}

function isRealPhoto(url: string | undefined): boolean {
  return Boolean(url && !url.startsWith('data:'))
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

const thumbCols: Record<NonNullable<DenseStoryItemProps['thumb']>, string> = {
  sm: 'grid-cols-[4.5rem_minmax(0,1fr)] sm:grid-cols-[5rem_minmax(0,1fr)]',
  md: 'grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[6.5rem_minmax(0,1fr)]',
  lg: 'grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[8.5rem_minmax(0,1fr)]',
}

/**
 * Shared dense story row: thumb + category/dateline + headline + optional deck.
 * Used across latest, featured, and sidebar rails for consistent portal density.
 */
export function DenseStoryItem({
  story,
  locale,
  showDeck = true,
  showMeta = true,
  showDateline = true,
  rank,
  compact = false,
  showThumb: showThumbProp,
  thumb = 'sm',
  className = '',
}: DenseStoryItemProps) {
  const english = locale === 'en'
  const title = english && story.titleEn ? story.titleEn : story.titleNe
  const titleLang = english && story.titleEn ? 'en' : 'ne'
  const deck = deckFor(story, locale)
  const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
  const image = story.heroImage
  const showThumb = showThumbProp !== false && isRealPhoto(image?.url)
  const rankLabel = rank !== undefined ? String(rank) : null

  const body = (
    <>
      {showThumb ? (
        <Link
          href={href}
          className="relative aspect-[4/3] shrink-0 overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={image!.url}
            alt=""
            fill
            unoptimized={image!.url.startsWith('data:')}
            sizes={thumb === 'lg' ? '120px' : '80px'}
            className="object-cover transition-transform duration-slow ease-out-quint group-hover:scale-[1.03]"
          />
        </Link>
      ) : null}

      <div className="min-w-0">
        {showMeta ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
            <span className="font-bold text-brand-strong" lang={english ? 'en' : 'ne'}>
              {english && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
            </span>
            {showDateline ? (
              <>
                <span className="text-mute" aria-hidden="true">
                  ·
                </span>
                <Dateline iso={story.publishedAt} locale={locale} />
              </>
            ) : null}
          </div>
        ) : null}

        <h3
          className={`mt-0.5 font-display font-bold leading-snug text-ink ${
            compact ? 'text-meta sm:text-body' : 'text-body sm:text-body-lg'
          }`}
        >
          <Link
            href={href}
            className="cursor-pointer transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            lang={titleLang}
          >
            <span className="line-clamp-2 text-pretty">{title}</span>
          </Link>
        </h3>

        {showDeck && deck ? (
          <p
            className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft sm:text-meta"
            lang={titleLang}
          >
            {deck}
          </p>
        ) : null}
      </div>
    </>
  )

  if (rankLabel) {
    return (
      <article className={`group flex items-start gap-2.5 ${className}`.trim()}>
        <span
          className="mt-0.5 w-5 shrink-0 text-right font-display text-meta font-bold tabular-nums text-brand"
          aria-hidden="true"
        >
          {rankLabel}
        </span>
        <div className={`min-w-0 flex-1 ${showThumb ? `grid ${thumbCols[thumb]} gap-2.5` : ''}`}>
          {body}
        </div>
      </article>
    )
  }

  return (
    <article
      className={`group ${showThumb ? `grid ${thumbCols[thumb]} gap-2.5` : ''} ${className}`.trim()}
    >
      {body}
    </article>
  )
}
