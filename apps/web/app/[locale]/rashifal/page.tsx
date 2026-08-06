import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { RASHIFAL_SIGNS } from '@/lib/rashifal'
import { formatDate, toDevanagari } from '@nagarikwatch/db'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const revalidate = 3600

export default async function RashifalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const today = formatDate(new Date().toISOString(), locale)

  return (
    <div className="mx-auto max-w-page px-4 py-5 sm:py-7">
      <HubIndexHeader
        title={en ? "Today's rashifal" : 'आजको राशिफल'}
        lead={
          en
            ? `${today}. Entertainment only, not news reporting.`
            : `${today}। मनोरञ्जन मात्र, समाचार रिपोर्टिङ होइन।`
        }
        lang={lang}
      />

      <ol className="rashifal-grid">
        {RASHIFAL_SIGNS.map((sign) => (
          <li key={sign.slug} className="rashifal-grid__item">
            <span className="rashifal-grid__glyph" aria-hidden="true">
              {sign.symbol}
            </span>
            <div>
              <h2 lang={lang}>{en ? sign.nameEn : sign.nameNe}</h2>
              <p lang={lang}>{en ? sign.forecastEn : sign.forecastNe}</p>
              <p className="rashifal-grid__meta" lang={lang}>
                {en ? 'Lucky number' : 'भाग्य अंक'}:{' '}
                {en ? sign.luckyNumber : toDevanagari(sign.luckyNumber)}
                {' · '}
                {en ? 'Lucky color' : 'भाग्य रंग'}: {en ? sign.luckyColorEn : sign.luckyColorNe}
              </p>
            </div>
          </li>
        ))}
      </ol>
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
