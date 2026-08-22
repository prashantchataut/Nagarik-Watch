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

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function pickProvinceLeads(stories: StoryCardData[]): Map<string, StoryCardData> {
  const leads = new Map<string, StoryCardData>()
  const sorted = [...stories].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  for (const story of sorted) {
    const province = story.province?.trim()
    if (!province || leads.has(province)) continue
    leads.set(province, story)
  }
  return leads
}

/**
 * Province hub: real provincial leads when inventory exists, otherwise a compact
 * horizontal navigator. Empty pseudo-cards are never fabricated.
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
        <ul className="mt-4 flex flex-wrap gap-3">
          {populated.slice(0, 6).map(({ province, story }) => {
            if (!story) return null
            const deck = deckFor(story, locale)
            return (
              <li
                key={province.slug}
                className="min-w-0 flex-1 basis-[18rem] bg-surface-raised px-3.5 py-3.5 sm:px-4"
              >
                <Link
                  href={localizeHref(locale, `/province/${province.slug}`)}
                  className="text-caption font-extrabold text-brand-strong hover:underline"
                  lang={lang}
                >
                  {english ? province.nameEn : province.nameNe}
                </Link>
                <h3
                  className="mt-1.5 text-pretty font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-body-lg"
                  lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}
                >
                  <Link href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}>
                    {titleFor(story, locale)}
                  </Link>
                </h3>
                {deck ? (
                  <p
                    className="mt-1.5 line-clamp-2 text-caption leading-relaxed text-ink-soft"
                    lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}
                  >
                    {deck}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <nav
          aria-label={english ? 'Province news' : 'प्रदेश समाचार'}
          className="mt-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex min-w-max gap-2 sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-7">
            {PROVINCES.map((province) => (
              <li key={province.slug}>
                <Link
                  href={localizeHref(locale, `/province/${province.slug}`)}
                  className="group flex min-h-11 min-w-[8.25rem] items-center justify-center bg-surface-raised px-3 py-2.5 text-center transition-colors duration-fast ease-out-quint hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:min-w-0"
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
