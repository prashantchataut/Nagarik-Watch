import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { RASHIFAL_SIGNS } from '@/lib/rashifal'
import { formatDate, toDevanagari } from '@nagarikwatch/db'

export const revalidate = 3600

export default async function RashifalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const today = formatDate(new Date().toISOString(), locale)

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={en ? 'en' : 'ne'}
        >
          {en ? 'Daily Horoscope' : 'दैनिक राशिफल'}
        </p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={en ? 'en' : 'ne'}>
          {en ? 'Today’s Rashifal' : 'आजको राशिफल'}
        </h1>
        <p className="mt-2 text-meta text-mute" lang={en ? 'en' : 'ne'}>
          {today}
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RASHIFAL_SIGNS.map((sign) => (
          <div key={sign.slug} className="rounded-lg border border-rule bg-surface-raised p-5">
            <div className="flex items-center gap-3 border-b border-rule pb-3">
              <span className="text-h1 text-brand" aria-hidden="true">
                {sign.symbol}
              </span>
              <div>
                <p className="font-display text-h3 font-bold text-ink" lang={en ? 'en' : 'ne'}>
                  {en ? sign.nameEn : sign.nameNe}
                </p>
                <p className="text-caption text-mute" lang={en ? 'en' : 'ne'}>
                  {en ? sign.nameEn : sign.nameNe}
                </p>
              </div>
            </div>
            <p className="mt-3 text-body text-ink-soft leading-relaxed" lang={en ? 'en' : 'ne'}>
              {en ? sign.forecastEn : sign.forecastNe}
            </p>
            <div className="mt-3 flex gap-4 text-caption text-mute" lang={en ? 'en' : 'ne'}>
              <span>
                {en ? 'Lucky number' : 'भाग्य अंक'}:{' '}
                {en ? sign.luckyNumber : toDevanagari(sign.luckyNumber)}
              </span>
              <span>
                {en ? 'Lucky color' : 'भाग्य रंग'}: {en ? sign.luckyColorEn : sign.luckyColorNe}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Daily Horoscope' : 'दैनिक राशिफल',
    alternates: {
      canonical: `${prefix}/rashifal`,
      languages: { ne: '/rashifal', en: '/en/rashifal' },
    },
  }
}
