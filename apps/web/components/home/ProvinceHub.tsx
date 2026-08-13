import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
import { PROVINCES } from '@/lib/site'
import { localizeHref } from '@/lib/i18n/locales'

type ProvinceHubProps = {
  locale: Locale
  className?: string
  /** Optional edition catalog so the band can show real provincial leads. */
  stories?: StoryCardData[]
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function pickProvinceLeads(stories: StoryCardData[]): Map<string, StoryCardData> {
  const leads = new Map<string, StoryCardData>()
  const sorted = [...stories].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )
  for (const story of sorted) {
    const province = story.province?.trim()
    if (!province || leads.has(province)) continue
    leads.set(province, story)
  }
  return leads
}

/**
 * Province band: packed story leads when inventory exists, otherwise a dense
 * nav of province links (never an empty faux desk).
 */
export function ProvinceHub({ locale, className, stories = [] }: ProvinceHubProps) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const leads = pickProvinceLeads(stories)
  const populated = PROVINCES.map((province) => ({
    province,
    story: leads.get(province.slug),
  })).filter((row) => Boolean(row.story))

  return (
    <section className={className} aria-labelledby="home-provinces-title">
      <SectionHeader
        id="home-provinces-title"
        title={english ? 'Across Nepal' : 'प्रदेशबाट'}
        locale={locale}
        href={localizeHref(locale, '/province')}
        moreLabel={english ? 'All provinces' : 'सबै प्रदेश'}
      />

      {populated.length >= 3 ? (
        <ul className="mt-3.5 grid gap-0 divide-y divide-rule border-y border-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          {populated.slice(0, 6).map(({ province, story }, index) => {
            if (!story) return null
            return (
              <li
                key={province.slug}
                className={`min-w-0 py-3 sm:px-4 ${index % 2 === 0 ? 'sm:pl-0' : ''} ${
                  index % 2 === 1 ? 'sm:pr-0 lg:pr-4' : ''
                } ${index >= 2 ? 'sm:border-t sm:border-rule lg:border-t-0' : ''} ${
                  index === populated.length - 1 || index === 5 ? 'lg:pr-0' : ''
                }`}
              >
                <p
                  className="text-caption font-bold text-brand-strong"
                  lang={lang}
                >
                  {english ? province.nameEn : province.nameNe}
                </p>
                <h3
                  className="mt-1 text-pretty font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-body-lg"
                  lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}
                >
                  <Link href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}>
                    {titleFor(story, locale)}
                  </Link>
                </h3>
              </li>
            )
          })}
        </ul>
      ) : (
        <nav
          aria-label={english ? 'Province news' : 'प्रदेश समाचार'}
          className="mt-3 overflow-x-auto border-y border-rule [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex min-w-max items-stretch sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-7">
            {PROVINCES.map((province, index) => (
              <li key={province.slug} className={index > 0 ? 'border-l border-rule' : ''}>
                <Link
                  href={localizeHref(locale, `/province/${province.slug}`)}
                  className="group flex min-h-11 min-w-[8.5rem] items-center gap-2 px-3 py-2.5 transition-colors duration-fast ease-out-quint hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:min-w-0"
                  lang={lang}
                >
                  <span className="font-display text-meta font-bold text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-body">
                    {english ? province.nameEn : province.nameNe}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  )
}
