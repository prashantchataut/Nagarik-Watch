import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getStories } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'

type Params = { locale: string }

export default async function TrendingPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)

  const result = await getStories({ locale, limit: 12 })
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  const provisional =
    locale === 'ne'
      ? 'अहलेलाई हालैका प्रमुख समाचार देखाइएको छ। वास्तविक लोकप्रियता मापन जोडिएपछि यो सूची अद्यावधिक हुनेछ।'
      : 'Showing recent prominent stories for now. This list will update once real popularity metrics are connected.'

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
          {dict.navTrending}
        </h1>
        <p className="mt-3 max-w-body text-meta text-mute" lang={lang}>
          {provisional}
        </p>
      </header>

      <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((s, i) => (
          <li key={s.slug} className="flex gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 font-display text-h1 font-bold leading-none text-rule"
            >
              {locale === 'ne' ? toNeDigits(i + 1) : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <StoryCard story={s} locale={locale} variant="compact" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

const NE = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
function toNeDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => NE[Number(d)] ?? d)
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)
  return {
    title: dict.navTrending,
    alternates: {
      canonical: `${prefix}/trending`,
      languages: { ne: '/trending', en: '/en/trending' },
    },
  }
}
