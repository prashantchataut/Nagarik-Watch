import Link from 'next/link'
import { adToBs, type Locale, type StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { localizeNumber } from '@/lib/live/format'

type TodayInHistoryProps = {
  locale: Locale
  stories: StoryCardData[]
  /** anniversary = same calendar day in prior years; archive = corpus fallback so the band never vanishes */
  mode?: 'anniversary' | 'archive'
}

/** Compact anniversary / archive list for the homepage. */
export function TodayInHistory({ locale, stories, mode = 'anniversary' }: TodayInHistoryProps) {
  if (stories.length === 0) return null
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const title =
    mode === 'archive'
      ? en
        ? 'From the archive'
        : 'संग्रहबाट'
      : en
        ? 'Today in history'
        : 'आजको इतिहास'

  return (
    <section aria-labelledby="today-in-history-title" lang={lang}>
      <div className="mb-2.5">
        <h2 id="today-in-history-title" className="font-display text-h3 font-extrabold text-ink">
          {title}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      </div>
      <ol className="divide-y divide-rule border-y border-rule">
        {stories.slice(0, 5).map((story, index) => {
          const published = new Date(story.publishedAt)
          const yearLabel = Number.isNaN(published.getTime())
            ? String(index + 1).padStart(2, '0')
            : en
              ? String(published.getUTCFullYear())
              : localizeNumber(adToBs(published).year, locale)
          const label = en && story.titleEn ? story.titleEn : story.titleNe
          return (
            <li key={story.id}>
              <Link
                href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                className="group flex min-h-11 items-start gap-3 py-2.5"
              >
                <span
                  className="mt-0.5 w-10 shrink-0 font-display text-meta font-bold tabular-nums text-brand"
                  aria-hidden="true"
                >
                  {yearLabel}
                </span>
                <span className="min-w-0 font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong">
                  <span className="line-clamp-2">{label}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
