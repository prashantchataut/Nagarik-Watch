import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'
import { CookiePreferencesPanel } from '@/components/CookiePreferencesPanel'

type Params = { locale: string }

/**
 * Privacy policy. Explains optional analytics (Plausible), contact-form data,
 * cookie choices, and reader rights. Mirrors the minimal-data principle at the code level.
 */
export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const english = locale === 'en'

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <InfoPageHeader kicker={dict.privacyKicker} lead={dict.privacyLead} lang={lang} />

      <div className="mt-10 space-y-10">
        <InfoSection heading={english ? 'Cookies and browser storage' : 'कुकी र ब्राउजर भण्डारण'} lang={lang}>
          {english
            ? 'Essential storage keeps login and language working. Optional personalisation and analytics run only after you consent. Full detail and controls are on the cookie policy page.'
            : 'आवश्यक भण्डारणले लगइन र भाषा चलाउँछ। वैकल्पिक व्यक्तिगत सिफारिस र एनालिटिक्स सहमतिपछि मात्र चल्छ। विस्तृत नियन्त्रण कुकी नीति पृष्ठमा छ।'}{' '}
          <Link
            href={localizeHref(locale, '/cookies')}
            className="font-semibold text-brand-strong underline-offset-2 hover:underline"
          >
            {english ? 'Open cookie policy' : 'कुकी नीति खोल्नुहोस्'}
          </Link>
        </InfoSection>
        <InfoSection heading={dict.privacyAnalyticsHeading} lang={lang}>
          {dict.privacyAnalytics}
        </InfoSection>
        <InfoSection heading={dict.privacyContactHeading} lang={lang}>
          {dict.privacyContact}
        </InfoSection>
        <InfoSection heading={dict.privacyRightsHeading} lang={lang}>
          {dict.privacyRights}
        </InfoSection>
      </div>

      <CookiePreferencesPanel locale={locale} />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)
  const opposite = locale === 'en' ? '' : '/en'
  return {
    title: dict.footerPrivacy,
    description: dict.privacyLead,
    alternates: {
      canonical: `${prefix}/privacy`,
      languages: { ne: '/privacy', en: `${opposite}/privacy` },
    },
  }
}
