import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'

type Params = { locale: string }

/**
 * Editorial policy. The standards every Nagarik Watch story is held to: accuracy and
 * corrections, source attribution, and editorial independence. Referenced by the footer
 * and by the corrections notice on article pages.
 */
export default async function EthicsPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <InfoPageHeader kicker={dict.ethicsKicker} lead={dict.ethicsLead} lang={lang} />

      <div className="mt-10 space-y-10">
        <InfoSection heading={dict.ethicsAccuracyHeading} lang={lang}>
          {dict.ethicsAccuracy}
        </InfoSection>
        <InfoSection heading={dict.ethicsSourcesHeading} lang={lang}>
          {dict.ethicsSources}
        </InfoSection>
        <InfoSection heading={dict.ethicsIndependenceHeading} lang={lang}>
          {dict.ethicsIndependence}
        </InfoSection>
      </div>
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
    title: dict.footerEthics,
    description: dict.ethicsLead,
    alternates: {
      canonical: `${prefix}/ethics`,
      languages: { ne: '/ethics', en: `${opposite}/ethics` },
    },
  }
}
