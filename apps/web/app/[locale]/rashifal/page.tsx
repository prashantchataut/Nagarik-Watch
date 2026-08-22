import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { getPublishedRashifal } from '@/lib/rashifal'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { relativeTime } from '@/lib/live/format'

export const revalidate = 900

export default async function RashifalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const edition = await getPublishedRashifal()
  const today = formatDate(new Date().toISOString(), locale)

  return (
    <div className="mx-auto max-w-page px-4 py-5 sm:py-8">
      <HubIndexHeader
        title={en ? "Today's rashifal" : 'आजको राशिफल'}
        lead={
          en
            ? 'An editor-published daily entertainment feature. It is not news reporting, financial advice or a prediction service.'
            : 'सम्पादकले दैनिक रूपमा प्रकाशित गर्ने मनोरञ्जन सामग्री। यो समाचार रिपोर्टिङ, आर्थिक सल्लाह वा भविष्यवाणी सेवा होइन।'
        }
        lang={lang}
      />

      {edition ? (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-rule py-2 text-caption text-ink-soft">
            <span lang={lang}>{today}</span>
            <span lang={lang}>
              {en ? 'Edition' : 'संस्करण'}: {edition.source} ·{' '}
              {relativeTime(edition.updatedAt, locale)}
            </span>
          </div>
          <ol className="mt-4 grid border-t border-rule md:grid-cols-2 md:[&>li:nth-child(odd)]:border-r md:[&>li:nth-child(odd)]:pr-6 md:[&>li:nth-child(even)]:pl-6">
            {edition.signs.map((sign, index) => (
              <li
                key={sign.slug}
                className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-b border-rule py-5"
              >
                <span
                  className="text-center text-[2rem] leading-none text-brand-strong"
                  aria-hidden="true"
                >
                  {sign.symbol}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-caption font-black tabular-nums text-mute"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h2 className="font-display text-h3 font-extrabold text-ink" lang={lang}>
                      {en ? sign.nameEn : sign.nameNe}
                    </h2>
                  </div>
                  <p className="mt-2 text-body leading-relaxed text-ink-soft" lang={lang}>
                    {en ? sign.forecastEn || sign.forecastNe : sign.forecastNe}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <section className="mt-6 border-y border-rule py-8" lang={lang}>
          <p className="font-display text-h2 font-extrabold text-ink">
            {en ? "Today's edition has not been published" : 'आजको संस्करण प्रकाशित भएको छैन'}
          </p>
          <p className="mt-2 max-w-body text-body leading-relaxed text-ink-soft">
            {en
              ? 'Nagarik Watch does not recycle an old forecast under a new date. When the newsroom publishes all 12 signs for today, they will appear here.'
              : 'नागरिक वाचले पुरानो राशिफलमा नयाँ मिति राखेर देखाउँदैन। न्युजरुमले आजका १२ राशिको पूर्ण संस्करण प्रकाशित गरेपछि यहीँ देखिन्छ।'}
          </p>
          <Link
            href={localizeHref(locale, '/utilities')}
            className="mt-4 inline-flex min-h-11 items-center border-y border-rule px-1 text-meta font-bold text-brand-strong hover:border-brand"
          >
            {en ? 'Open reliable utilities' : 'अन्य भरपर्दा उपकरण खोल्नुहोस्'}
          </Link>
        </section>
      )}
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
    title: locale === 'en' ? 'Daily Rashifal' : 'दैनिक राशिफल',
    alternates: {
      canonical: `${prefix}/rashifal`,
      languages: { ne: '/rashifal', en: '/en/rashifal' },
    },
  }
}
