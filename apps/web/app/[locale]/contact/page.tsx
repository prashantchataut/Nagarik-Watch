import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'

type Params = { locale: string }

/**
 * Contact page. Routes readers to news tips, correction requests and general email. There is
 * no form submission yet (Phase 3 newsletter/forms) so the page lists direct email channels
 * and the correction workflow, which is what readers and sources actually need today.
 */
export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <InfoPageHeader kicker={dict.contactKicker} lead={dict.contactLead} lang={lang} />

      <div className="mt-10 space-y-10">
        <InfoSection heading={dict.contactTipHeading} lang={lang}>
          {dict.contactTip}
        </InfoSection>
        <InfoSection heading={dict.contactCorrectionHeading} lang={lang}>
          {dict.contactCorrection}
        </InfoSection>
      </div>

      <div className="mt-10 border-t border-rule pt-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft" lang={lang}>
          {dict.contactEmailLabel}
        </p>
        <a
          href={`mailto:${dict.contactEmail}`}
          className="mt-2 inline-block font-display text-h2 font-bold text-brand transition-colors duration-fast ease-out-quint hover:text-brand-strong"
          lang="en"
        >
          {dict.contactEmail}
        </a>
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
    title: dict.footerContact,
    description: dict.contactLead,
    alternates: {
      canonical: `${prefix}/contact`,
      languages: { ne: '/contact', en: `${opposite}/contact` },
    },
  }
}
