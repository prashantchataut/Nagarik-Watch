import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Dateline } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

type LatestRailProps = {
  stories: StoryCardData[]
  locale: Locale
  className?: string
}

export function LatestRail({ stories, locale, className }: LatestRailProps) {
  const items = stories.slice(0, 7)
  if (items.length === 0) return null
  const english = locale === 'en'

  return (
    <aside className={className} aria-labelledby="latest-rail-title">
      <div className="flex items-center justify-between border-b-[3px] border-ink pb-2">
        <h2 id="latest-rail-title" className="font-display text-h2 font-black text-ink" lang={english ? 'en' : 'ne'}>
          {english ? 'Latest updates' : 'ताजा अपडेट'}
        </h2>
        <Link href={localizeHref(locale, '/latest')} className="text-meta font-bold text-brand-strong hover:underline" lang={english ? 'en' : 'ne'}>
          {english ? 'All' : 'सबै'}
        </Link>
      </div>
      <ol className="divide-y divide-rule">
        {items.map((story, index) => {
          const title = english && story.titleEn ? story.titleEn : story.titleNe
          const titleLang = english && story.titleEn ? 'en' : 'ne'
          return (
            <li key={story.id} className="grid grid-cols-[2rem_1fr] gap-3 py-3.5">
              <span className="font-display text-h2 font-black leading-none text-rule" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <Link
                  href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                  className="font-display text-body-lg font-bold leading-snug text-ink hover:text-brand-strong"
                  lang={titleLang}
                >
                  {title}
                </Link>
                <div className="mt-1 flex items-center gap-2 text-caption text-mute">
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
