import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { CookiePreferencesPanel } from '@/components/CookiePreferencesPanel'
import { InfoPageHeader } from '@/components/InfoPage'
import { ManageCookiesButton } from '@/components/ManageCookiesButton'
import { getAdMode } from '@/lib/ads'

type Params = { locale: string }

function cookieSections(networkAds: boolean) {
  return [
    {
      id: 'what-we-use',
      titleNe: 'हामी के प्रयोग गर्छौं',
      titleEn: 'What we use',
      bodyNe: networkAds
        ? 'कुकी र स्थानीय भण्डारणले भाषा, थिम, लगइन सेसन र अनुमति दिएपछि मात्र पढाइ रुचि, एनालिटिक्स र विज्ञापन मापन सम्झन्छ। नेटवर्क विज्ञापन मोड सक्रिय हुँदा विज्ञापन सहमतिपछि मात्र प्रकाशकको AdSense/GAM स्क्रिप्ट लोड हुन्छ। हामी डाटा बेच्दैनौं।'
        : 'कुकी र स्थानीय भण्डारणले भाषा, थिम, लगइन सेसन र अनुमति दिएपछि मात्र पढाइ रुचि, एनालिटिक्स र घरको विज्ञापन मापन सम्झन्छ। हामी डाटा बेच्दैनौं वा तेस्रो-पक्ष विज्ञापन ट्र्याकर लोड गर्दैनौं।',
      bodyEn: networkAds
        ? 'Cookies and local storage remember language, theme, login session and, only with permission, reading interests, analytics and advertising measurement. When network ads mode is on, publisher AdSense or GAM scripts load only after advertising consent. We do not sell data.'
        : 'Cookies and local storage remember language, theme, login session and, only with permission, reading interests, analytics and first-party house-ad measurement. We do not sell data or load third-party advertising trackers.',
    },
    {
      id: 'essential',
      titleNe: 'आवश्यक',
      titleEn: 'Essential',
      bodyNe:
        'सुरक्षा र आधारभूत सञ्चालनका लागि आवश्यक: Better Auth सेसन कुकी, भाषा, थिम, र CSRF/same-site सुरक्षा। यी बन्द गर्न सकिँदैन।',
      bodyEn:
        'Required for security and basic operation: Better Auth session cookies, locale preference, theme, and CSRF/same-site protections. These cannot be turned off.',
    },
    {
      id: 'personalization',
      titleNe: 'व्यक्तिगत (वैकल्पिक)',
      titleEn: 'Personalisation (optional)',
      bodyNe:
        'अनुमति दिएमा यो ब्राउजरमा सुरक्षित लेख, जारी राख्ने प्रगति र सिफारिसका लागि रुचि सङ्केत राखिन्छ। बन्द गर्दा त्यो स्थानीय डाटा मेटिन्छ।',
      bodyEn:
        'If you allow it, this browser stores saved stories, continue-reading progress, and interest signals for recommendations. Turning it off clears that local data.',
    },
    {
      id: 'analytics',
      titleNe: 'एनालिटिक्स (वैकल्पिक)',
      titleEn: 'Analytics (optional)',
      bodyNe:
        'अनुमतिपछि मात्र Plausible लोड हुन्छ, र यसले विज्ञापन प्रोफाइलबिना भिजिट गणना गर्छ। सोही सहमतिले र्‍याङ्किङका लागि गोप्य कथा इम्प्रेसन घटना अनुमति दिन सक्छ।',
      bodyEn:
        'With permission we load Plausible, a privacy-friendly analytics script that counts visits without advertising profiles. The same consent can allow anonymous story impression events used for ranking.',
    },
    {
      id: 'advertising',
      titleNe: 'विज्ञापन मापन (वैकल्पिक)',
      titleEn: 'Advertising measurement (optional)',
      bodyNe: networkAds
        ? 'घर विज्ञापन मापन (दृश्य/क्लिक) र, नेटवर्क मोडमा, सहमतिपछि मात्र AdSense वा Google Ad Manager स्क्रिप्ट। Meta पिक्सेल छैन, डाटा बिक्री छैन।'
        : 'नागरिक वाचका आफ्नै घर विज्ञापन मात्र मापन (दृश्य/क्लिक)। Meta/Google पिक्सेल छैन, क्रस-साइट प्रोफाइल छैन, डाटा बिक्री छैन।',
      bodyEn: networkAds
        ? 'Measures house ad views/clicks and, in network mode, loads AdSense or Google Ad Manager scripts only after consent. No Meta pixels and no sale of data.'
        : 'Only measures our own house ad placements (views/clicks). No Meta/Google ad pixels, no cross-site profiles, no sale of data.',
    },
    {
      id: 'duration',
      titleNe: 'कति समय',
      titleEn: 'How long',
      bodyNe:
        'सहमति र रोजाइ कुकी अधिकतम १२ महिनासम्म रहन्छन्। सेसन कुकी साइन आउट वा ब्राउजर सेसन सकिएपछि सकिन्छ। कोटी फेरिएपछि एक पटक फेरि सोधिन्छ।',
      bodyEn:
        'Consent and preference cookies last up to 12 months. Session cookies end when you sign out or the browser session ends. When we change cookie categories, we ask again once.',
    },
  ] as const
}

export default async function CookiesPage({ params }: { params: Promise<Params> }) {
  const locale: Locale = asLocale((await params).locale)
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const SECTIONS = cookieSections(getAdMode() === 'network')

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:py-12">
      <div className="max-w-3xl">
        <InfoPageHeader
          title={english ? 'Cookie policy' : 'कुकी नीति'}
          lead={
            english
              ? 'How Nagarik Watch uses cookies and browser storage, and how you control them.'
              : 'नागरिक वाचले कुकी र ब्राउजर भण्डारण कसरी प्रयोग गर्छ, र तपाईंले त्यसलाई कसरी नियन्त्रण गर्नुहुन्छ।'
          }
          lang={lang}
          kicker={english ? 'Privacy' : 'गोपनीयता'}
        />
        <div className="mt-5">
          <ManageCookiesButton locale={locale} />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)] lg:items-start lg:gap-12">
        <div className="space-y-8">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 max-w-2xl border-b border-rule pb-8 last:border-b-0"
            >
              <h2 className="font-display text-h2 font-bold text-ink" lang={lang}>
                {english ? section.titleEn : section.titleNe}
              </h2>
              <p
                className="mt-3 text-body leading-relaxed text-ink-soft sm:text-body-lg"
                lang={lang}
              >
                {english ? section.bodyEn : section.bodyNe}
              </p>
            </section>
          ))}

          <p className="max-w-2xl text-body text-ink-soft" lang={lang}>
            {english ? 'See also our ' : 'हेर्नुहोस्: '}
            <Link
              href={localizeHref(locale, '/privacy')}
              className="font-semibold text-brand-strong underline-offset-2 hover:underline"
            >
              {english ? 'privacy policy' : 'गोपनीयता नीति'}
            </Link>
            {english ? '.' : '।'}
          </p>
        </div>

        <aside className="border border-rule bg-surface-raised p-4 lg:sticky lg:top-28">
          <p className="text-meta font-semibold text-brand-strong" lang={lang}>
            {english ? 'On this page' : 'यस पृष्ठमा'}
          </p>
          <nav className="mt-3 grid gap-2" aria-label={english ? 'Cookie sections' : 'कुकी खण्ड'}>
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-meta font-semibold text-ink-soft hover:text-brand-strong"
                lang={lang}
              >
                {english ? section.titleEn : section.titleNe}
              </a>
            ))}
            <a
              href="#cookie-preferences"
              className="text-meta font-semibold text-ink-soft hover:text-brand-strong"
              lang={lang}
            >
              {english ? 'Manage choices' : 'कुकी व्यवस्थापन'}
            </a>
          </nav>
        </aside>
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
