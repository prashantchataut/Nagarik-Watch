import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type TodayInBriefProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
  headingId?: string
}

const NE = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNeDigits(n: number, locale: Locale): string {
  if (locale !== 'ne') return String(n)
  return String(n).replace(/[0-9]/g, (d) => NE[Number(d)] ?? d)
}

/** Dense daily briefing list for sidebar or mid-page packing. */
export function TodayInBrief({
  stories,
  locale,
  className,
  headingId = 'today-in-brief',
}: TodayInBriefProps) {
  const items = stories.slice(0, 6)
  if (items.length === 0) return null

  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <section className={className} aria-labelledby={headingId}>
      <div className="border border-rule bg-surface-raised px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-end justify-between gap-3 border-b border-rule pb-2">
          <div className="min-w-0">
            <h2 id={headingId} className="font-display text-h3 font-extrabold text-ink" lang={lang}>
              {dict.briefTitle}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
          </div>
          <span className="mb-0.5 shrink-0 text-caption text-mute" lang={lang}>
            {dict.briefSubtitle}
          </span>
        </div>

        <ol className="mt-3 flex flex-col">
          {items.map((s, i) => {
            const title = locale === 'en' && s.titleEn ? s.titleEn : s.titleNe
            const titleLang = locale === 'en' && s.titleEn ? 'en' : 'ne'
            const href = localizeHref(locale, `/${s.category.slug}/${s.slug}`)
            return (
              <li
                key={s.slug}
                className="flex gap-2.5 border-b border-rule py-2.5 last:border-b-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 w-5 shrink-0 text-right font-display text-body font-bold leading-snug text-brand"
                >
                  {toNeDigits(i + 1, locale)}
                </span>
                <InstrumentedStory articleSlug={s.slug} articleCategory={s.category.slug}>
                  <Link
                    href={href}
                    className="group min-w-0 flex-1 text-meta font-semibold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-body"
                    lang={titleLang}
                  >
                    <span className="line-clamp-3">{title}</span>
                  </Link>
                </InstrumentedStory>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
