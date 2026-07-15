import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'
import { CookiePreferencesPanel } from '@/components/CookiePreferencesPanel'

type Params = { locale: string }

export default async function CookiesPage({ params }: { params: Promise<Params> }) {
  const locale: Locale = asLocale((await params).locale)
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <InfoPageHeader
        kicker={english ? 'Cookie policy' : 'कुकी नीति'}
        lead={
          english
            ? 'How Nagarik Watch uses cookies and similar browser storage, and how you control them.'
            : 'नागरिक वाचले कुकी र ब्राउजर भण्डारण कसरी प्रयोग गर्छ, र तपाईंले कसरी नियन्त्रण गर्नुहुन्छ।'
        }
        lang={lang}
      />

      <div className="mt-10 space-y-10">
        <InfoSection heading={english ? 'What we use' : 'हामी के प्रयोग गर्छौं'} lang={lang}>
          {english
            ? 'Cookies and local storage help the site remember your language, theme, login session and — only with permission — reading preferences. We do not sell data or run advertising trackers.'
            : 'कुकी र स्थानीय भण्डारणले भाषा, थिम, लगइन सेसन र — अनुमति दिएपछि मात्र — पढाइ रुचि सम्झन्छ। हामी डाटा बेच्दैनौं वा विज्ञापन ट्र्याकर चलाउँदैनौं।'}
        </InfoSection>

        <InfoSection heading={english ? 'Essential' : 'आवश्यक'} lang={lang}>
          {english
            ? 'Required for security and basic operation: Better Auth session cookies, locale preference, theme, and CSRF/same-site protections. These cannot be turned off.'
            : 'सुरक्षा र आधारभूत सञ्चालनका लागि आवश्यक: Better Auth सेसन कुकी, भाषा, थिम, र CSRF/same-site सुरक्षा। यी बन्द गर्न सकिँदैन।'}
        </InfoSection>

        <InfoSection heading={english ? 'Personalisation (optional)' : 'व्यक्तिगत (वैकल्पिक)'} lang={lang}>
          {english
            ? 'If you allow it, this browser stores saved stories, continue-reading progress, and interest signals for recommendations. Turning it off clears that local data.'
            : 'अनुमति दिएमा यो ब्राउजरमा सुरक्षित लेख, जारी राख्ने प्रगति र सिफारिसका लागि रुचि सङ्केत राखिन्छ। बन्द गर्दा त्यो स्थानीय डाटा मेटिन्छ।'}
        </InfoSection>

        <InfoSection heading={english ? 'Analytics (optional)' : 'एनालिटिक्स (वैकल्पिक)'} lang={lang}>
          {english
            ? 'With permission we load Plausible, a privacy-friendly analytics script that counts visits without advertising profiles. The script is not injected until you opt in.'
            : 'अनुमतिपछि मात्र Plausible लोड हुन्छ — विज्ञापन प्रोफाइलबिना भिजिट गणना गर्ने गोपनीयता-मैत्री एनालिटिक्स।'}
        </InfoSection>

        <InfoSection heading={english ? 'How long' : 'कति समय'} lang={lang}>
          {english
            ? 'Consent and preference cookies last up to 12 months. Session cookies end when you sign out or the browser session ends. You can change or withdraw consent below at any time.'
            : 'सहमति र रोजाइ कुकी अधिकतम १२ महिनासम्म रहन्छन्। सेसन कुकी साइन आउट वा ब्राउजर सेसन सकिएपछि सकिन्छ। तल जुनसुकै बेला बदल्न वा फिर्ता लिन सकिन्छ।'}
        </InfoSection>

        <p className="max-w-prose text-body text-ink-soft" lang={lang}>
          {english ? 'See also our ' : 'हेर्नुहोस्: '}
          <Link href={localizeHref(locale, '/privacy')} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
            {english ? 'privacy policy' : 'गोपनीयता नीति'}
          </Link>
          {english ? '.' : '।'}
        </p>
      </div>

      <CookiePreferencesPanel locale={locale} />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  const english = locale === 'en'
  const prefix = localePrefix(locale)
  const opposite = locale === 'en' ? '' : '/en'
  return {
    title: english ? 'Cookie policy' : 'कुकी नीति',
    description: english
      ? 'How Nagarik Watch uses cookies and how readers control consent.'
      : 'नागरिक वाचमा कुकी प्रयोग र पाठक सहमति नियन्त्रण।',
    alternates: {
      canonical: `${prefix}/cookies`,
      languages: { ne: '/cookies', en: `${opposite}/cookies` },
    },
  }
}
