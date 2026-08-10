import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'

type Params = { locale: string }

/**
 * About page. Static, bilingual content from the dictionary so it ships in both /about and
 * /en/about without per-locale files. Covers mission, ownership and funding so readers,
 * sources and advertisers can see how Nagarik Watch is sustained.
 */
export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-10">
      <InfoPageHeader
        kicker={dict.aboutKicker}
        title={dict.footerAbout}
        lead={dict.aboutLead}
        lang={lang}
      />

      <div className="mt-8 space-y-0">
        <InfoSection heading={dict.aboutMissionHeading} lang={lang}>
          {dict.aboutMission}
        </InfoSection>
        <InfoSection heading={dict.aboutFundingHeading} lang={lang}>
          {dict.aboutFunding}
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
    title: dict.footerAbout,
    description: dict.aboutLead,
    alternates: {
      canonical: `${prefix}/about`,
      languages: { ne: '/about', en: `${opposite}/about` },
    },
  }
}
