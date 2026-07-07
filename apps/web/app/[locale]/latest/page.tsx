import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getStories } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'
import { AdSlot } from '@/components/AdSlot'

type Params = { locale: string }

export default async function LatestPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const requested = Number.parseInt(sp.page ?? '1', 10)
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1

  const result = await getStories({ page, locale })
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={lang}
        >
          {dict.siteName}
        </p>
        <h1 className="mt-1 font-display text-display text-ink" lang={lang}>
          {dict.navLatest}
        </h1>
      </header>

      <div className="mt-6 flex justify-center">
        <AdSlot locale={locale} placementKey="latest-top" />
      </div>

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((s) => (
          <li key={s.slug}>
            <StoryCard story={s} locale={locale} variant="default" />
          </li>
        ))}
      </ul>

      <div className="mt-10 flex justify-center">
        <AdSlot locale={locale} placementKey="latest-inline" variant="native" />
      </div>

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={localizeHref(locale, '/latest')}
        locale={locale}
        className="mt-12"
      />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)
  return {
    title: dict.navLatest,
    alternates: { canonical: `${prefix}/latest`, languages: { ne: '/latest', en: '/en/latest' } },
  }
}
