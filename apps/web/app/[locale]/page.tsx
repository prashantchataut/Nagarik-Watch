import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { Hero, SectionHeader, StoryCard } from '@nagarikwatch/ui'
import { getHomepage } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'
import { TodayInBrief } from '@/components/home/TodayInBrief'
import { PollOfDay } from '@/components/home/PollOfDay'
import { FromWires } from '@/components/home/FromWires'
import { HomeLiveBoard } from '@/components/live/HomeLiveBoard'
import { AdSlot } from '@/components/AdSlot'

// ISR, not force-static: the homepage now carries live data (weather/AQI/forex/NEPSE)
// and the live RSS "From wires" rail. Content sections still prerender; the live bits
// refresh on the configured revalidate window so a reader never sees yesterday's
// market close or a stale wire feed.
export const revalidate = 300

type Params = { locale: string }

/**
 * Homepage. Reads the assembled homepage payload (lead, secondary rail, breaking ticker,
 * per-category sections) from the content source and renders it server-side — there is no
 * client fetch. The hero carries the lead, a secondary rail sits beside it, and each nav
 * category gets a SectionBlock below. Breaking news, when present, runs as a ticker above
 * the hero band.
 */
export default async function HomePage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const data = await getHomepage()
  if (!data) notFound()

  const dict = getDictionary(locale)
  const sectionHref = localizeHref(locale, `/${data.lead.category.slug}`)

  return (
    <div>
      {data.breaking.length > 0 && <BreakingTicker stories={data.breaking} locale={locale} />}

      {/* Above-the-fold leaderboard. Reserved size so filling it never shifts layout. */}
      <div className="mx-auto max-w-page px-4 pt-4">
        <AdSlot variant="leaderboard" locale={locale} placementKey="home-top" />
      </div>

      <div className="mx-auto max-w-page px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Hero story={data.lead} locale={locale} />
          </div>
          {data.secondary.length > 0 && (
            <aside aria-label={dict.more} className="flex flex-col gap-8 lg:col-span-1">
              {/* The day at a glance, sitting beside the lead so a scanning reader gets the
                  gist before committing to a story. Uses the day's top headlines. */}
              <TodayInBrief stories={data.secondary} locale={locale} />

              {/* Reader poll — vote-once via localStorage until the CMS poll store is wired. */}
              <PollOfDay locale={locale} />

              <div>
                <SectionHeader title={dict.more} locale={locale} />
                <ul className="mt-5 flex flex-col gap-6">
                  {data.secondary.slice(0, 4).map((s) => (
                    <li key={s.slug}>
                      <StoryCard story={s} locale={locale} variant="horizontal" />
                    </li>
                  ))}
                </ul>
                <a
                  href={sectionHref}
                  className="mt-6 inline-block text-meta font-semibold text-brand transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                  lang={locale === 'en' ? 'en' : 'ne'}
                >
                  {dict.seeAll} →
                </a>
              </div>
            </aside>
          )}
        </div>

        {/* Live data board (weather / AQI / NEPSE / forex). Each card carries its real
            upstream source, freshness, and a MOCK badge only when a feed has degraded. */}
        <HomeLiveBoard locale={locale} className="mt-12 border-t border-rule pt-8" />

        {/* Real headlines from official Nepali outlets' RSS. Headline+link only,
            attributed; taps open the original story on the publisher's site. */}
        <FromWires locale={locale} className="mt-12" />

        {/* Mid-feed in-read ad. */}
        <div className="mt-12 flex justify-center">
          <AdSlot variant="leaderboard" locale={locale} placementKey="home-mid" />
        </div>

        <div className="mt-16 flex flex-col gap-16">
          {data.sections.map((section) => (
            <SectionBlock key={section.category.slug} section={section} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: '/',
      languages: { ne: '/', en: '/en' },
    },
  }
}
