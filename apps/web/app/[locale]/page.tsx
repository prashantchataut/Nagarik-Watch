import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { Hero, SectionHeader, StoryCard } from '@nagarikwatch/ui'
import { getHomepage } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { BreakingTicker } from '@/components/BreakingTicker'
import { SectionBlock } from '@/components/home/SectionBlock'

export const dynamic = 'force-static'

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
      {data.breaking.length > 0 && (
        <BreakingTicker stories={data.breaking} locale={locale} />
      )}

      <div className="mx-auto max-w-page px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Hero story={data.lead} locale={locale} />
          </div>
          {data.secondary.length > 0 && (
            <aside aria-label={dict.relatedStories} className="lg:col-span-1">
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
            </aside>
          )}
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
