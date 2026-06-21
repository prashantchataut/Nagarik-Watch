import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'

type Params = { locale: string }

/**
 * Privacy policy. Explains the cookieless analytics stack (Plausible), how contact-form
 * data is handled, and reader rights over personal data. Mirrors the minimal-data principle
 * the site already follows at the code level.
 */
export default async function PrivacyPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <InfoPageHeader kicker={dict.privacyKicker} lead={dict.privacyLead} lang={lang} />

      <div className="mt-10 space-y-10">
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
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
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
