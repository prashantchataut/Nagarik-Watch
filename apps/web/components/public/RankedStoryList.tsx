import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type RankedStoryListProps = {
  stories: StoryCardData[]
  locale: Locale
  /** Visual framing hint for aria / empty copy differentiation. */
  mode?: 'latest' | 'trending' | 'most-read'
}

function rankLabel(index: number, locale: Locale): string {
  const n = index + 1
  if (locale === 'en') return String(n)
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(n)
    .split('')
    .map((d) => digits[Number(d)] ?? d)
    .join('')
}

/** Shared numbered list for latest / trending / most-read — no mono ranks. */
export function RankedStoryList({ stories, locale }: RankedStoryListProps) {
  if (!stories.length) return null

  return (
    <ol className="mt-8 divide-y divide-rule border-y border-rule">
      {stories.map((story, index) => {
        const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
        const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
        const lang = locale === 'en' && story.titleEn ? 'en' : 'ne'
        return (
          <li key={story.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-4">
            <span className="pt-0.5 font-display text-h2 font-extrabold tabular-nums text-brand-strong" aria-hidden="true">
              {rankLabel(index, locale)}
            </span>
            <div className="min-w-0">
              <p className="text-caption font-semibold text-ink-soft" lang={lang}>
                {locale === 'en' && story.category.nameEn ? story.category.nameEn : story.categoryLabel}
              </p>
              <Link
                href={href}
                lang={lang}
                className="mt-1 block font-display text-h3 font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
              >
                {title}
              </Link>
              {story.byline ? (
                <p className="mt-1.5 text-meta text-mute">{story.byline}</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
