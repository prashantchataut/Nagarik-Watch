import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

type TodayInBriefProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

/**
 * "आजका मुख्य कुरा / Today in brief" — a concise daily-briefing module (spec Phase 4
 * "5 कुरा थाहा पाउनुहोस्"). It gives a scanning reader the day at a glance: a short numbered
 * list of the top headlines, each a real link. This is the civic-news answer to a long,
 * heavy homepage, you can read the gist in ten seconds, then dive in.
 *
 * Editorial honesty: these are the current top stories from the real content source, not an
 * AI-written summary. Numbering is a scanning aid, not a popularity ranking.
 *
 * It is a flat, typographic block (no card grid, no gradient, impeccable laws). The numerals
 * render in Devanagari in the Nepali locale.
 */
const NE = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNeDigits(n: number, locale: Locale): string {
  if (locale !== 'ne') return String(n)
  return String(n).replace(/[0-9]/g, (d) => NE[Number(d)] ?? d)
}

export function TodayInBrief({ stories, locale, className }: TodayInBriefProps) {
  const items = stories.slice(0, 5)
  if (items.length === 0) return null

  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <section
      className={className}
      aria-labelledby="today-in-brief"
    >
      <div className="rounded-lg border border-rule bg-surface-raised p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
          <h2 id="today-in-brief" className="font-display text-h2 text-ink" lang={lang}>
            {dict.briefTitle}
          </h2>
          <span className="text-meta text-mute" lang={lang}>
            {dict.briefSubtitle}
          </span>
        </div>

        <ol className="mt-4 flex flex-col gap-3.5">
          {items.map((s, i) => {
            const title = locale === 'en' && s.titleEn ? s.titleEn : s.titleNe
            const titleLang = locale === 'en' && s.titleEn ? 'en' : 'ne'
            const href = localizeHref(locale, `/${s.category.slug}/${s.slug}`)
            return (
              <li key={s.slug} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 w-5 shrink-0 text-right font-display text-h3 font-bold leading-snug text-brand"
                >
                  {toNeDigits(i + 1, locale)}
                </span>
                <Link
                  href={href}
                  className="group min-w-0 flex-1 text-body-lg font-medium leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                  lang={titleLang}
                >
                  {title}
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
