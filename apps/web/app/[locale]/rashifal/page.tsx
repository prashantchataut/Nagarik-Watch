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
  const today = formatDate(new Date().toISOString(), locale)

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <HubIndexHeader
        title={en ? "Today's rashifal" : 'आजको राशिफल'}
        lead={
          en
            ? `Standing editorial forecasts for ${today}. Entertainment only, not news reporting. Desk CMS for daily updates is not live yet.`
            : `${today} को सम्पादकीय राशिफल (स्थायी पाठ)। मनोरञ्जन मात्र, समाचार रिपोर्टिङ होइन। दैनिक अपडेट डेस्क अहिले उपलब्ध छैन।`
        }
        lang={en ? 'en' : 'ne'}
      />

      <ol className="mt-8 divide-y divide-rule border-y border-rule">
        {RASHIFAL_SIGNS.map((sign) => (
          <li key={sign.slug} className="grid gap-3 py-5 sm:grid-cols-[4rem_minmax(0,1fr)]">
            <span className="font-display text-h1 text-brand" aria-hidden="true">
              {sign.symbol}
            </span>
            <div>
              <h2 className="font-display text-h3 font-bold text-ink" lang={en ? 'en' : 'ne'}>
                {en ? sign.nameEn : sign.nameNe}
              </h2>
              <p className="mt-2 max-w-body text-body text-ink-soft leading-relaxed" lang={en ? 'en' : 'ne'}>
                {en ? sign.forecastEn : sign.forecastNe}
              </p>
              <p className="mt-2 text-caption text-mute" lang={en ? 'en' : 'ne'}>
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
