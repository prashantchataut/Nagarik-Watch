import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoSection, InfoPageHeader } from '@/components/InfoPage'
import { ContactForm } from '@/components/forms/ContactForm'

type Params = { locale: string }

/** Reader contact page with a persisted newsroom review workflow. */
export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <InfoPageHeader kicker={dict.contactKicker} title={dict.footerContact} lead={dict.contactLead} lang={lang} />

      <div className="mt-10 space-y-10">
        <InfoSection heading={dict.contactTipHeading} lang={lang}>
          {dict.contactTip}
        </InfoSection>
        <InfoSection heading={dict.contactCorrectionHeading} lang={lang}>
          {dict.contactCorrection}
        </InfoSection>
      </div>

      <section className="mt-10 border-y border-rule py-8" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title" className="font-display text-h1 text-ink" lang={lang}>
          {locale === 'en' ? 'Send a message' : 'सन्देश पठाउनुहोस्'}
        </h2>
        <p className="mt-2 max-w-2xl text-body text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'Messages are stored for newsroom review. Sending a message does not guarantee publication or an immediate reply.'
            : 'सन्देश न्युजरुम समीक्षाका लागि सुरक्षित हुन्छ। सन्देश पठाउँदैमा प्रकाशन वा तत्काल जवाफ सुनिश्चित हुँदैन।'}
        </p>
        <div className="mt-6"><ContactForm locale={locale} /></div>
      </section>

      <div className="mt-8">
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
