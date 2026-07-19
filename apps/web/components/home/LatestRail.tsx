import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

type LatestRailProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

const NE = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toLocaleDigits(n: number, locale: Locale): string {
  const padded = String(n).padStart(2, '0')
  if (locale !== 'ne') return padded
  return padded.replace(/[0-9]/g, (d) => NE[Number(d)] ?? d)
}

export function LatestRail({ stories, locale, className }: LatestRailProps) {
  const items = stories.slice(0, 7)
  if (items.length === 0) return null
  const english = locale === 'en'

  return (
    <aside className={className} aria-labelledby="latest-rail-title">
      <div className="flex items-center justify-between border-b-[3px] border-ink pb-2">
        <h2
          id="latest-rail-title"
          className="text-pretty font-display text-h2 font-black text-ink"
          lang={english ? 'en' : 'ne'}
        >
          {english ? 'Latest updates' : 'ताजा अपडेट'}
        </h2>
        <Link
          href={localizeHref(locale, '/latest')}
          className="cursor-pointer text-meta font-bold text-brand-strong underline-offset-4 transition-colors duration-fast ease-out-quint hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={english ? 'en' : 'ne'}
        >
          {english ? 'All' : 'सबै'}
        </Link>
      </div>
      <ol className="divide-y divide-rule">
        {items.map((story, index) => {
          const title = english && story.titleEn ? story.titleEn : story.titleNe
          const titleLang = english && story.titleEn ? 'en' : 'ne'
          return (
            <li key={story.id} className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-3.5">
              <span
                className="font-display text-h2 font-black leading-none tabular-nums text-rule"
                aria-hidden="true"
              >
                {toLocaleDigits(index + 1, locale)}
              </span>
              <div className="min-w-0">
                <Link
                  href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                  className="cursor-pointer font-display text-body-lg font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  lang={titleLang}
                >
                  <span className="line-clamp-3">{title}</span>
                </Link>
                <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-mute">
                  <span className="font-bold text-brand-strong" lang={english ? 'en' : 'ne'}>
                    {english && story.category.nameEn ? story.category.nameEn : story.category.nameNe}
                  </span>
                  <span aria-hidden="true">·</span>
                  <Dateline iso={story.publishedAt} locale={locale} />
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
