import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { InfoPageHeader } from '@/components/InfoPage'
import { ContactForm } from '@/components/forms/ContactForm'
import { NEWSROOM_DESKS, PUBLICATION, isPublicPublicationValue } from '@/lib/site'

type Params = { locale: string }

function DeskRow({
  label,
  value,
  lang,
}: {
  label: string
  value: string
  lang: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-caption font-semibold text-ink-soft" lang={lang}>
        {label}
      </p>
      <a
        href={`mailto:${value}`}
        className="text-meta font-bold text-brand transition-colors duration-fast ease-out-quint hover:text-brand-strong"
        lang="en"
      >
        {value}
      </a>
    </div>
  )
}

/** Reader contact page with a persisted newsroom review workflow. */
export default async function ContactPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const generalEmail = isPublicPublicationValue(PUBLICATION.email)
    ? PUBLICATION.email
    : NEWSROOM_DESKS.general
  const address = isPublicPublicationValue(PUBLICATION.address) ? PUBLICATION.address : ''
  const phone = isPublicPublicationValue(PUBLICATION.phone) ? PUBLICATION.phone : ''

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <InfoPageHeader
        kicker={dict.contactKicker}
        title={dict.footerContact}
        lead={dict.contactLead}
        lang={lang}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <section
              className="border border-rule bg-surface-raised px-4 py-4"
              aria-labelledby="contact-tip-title"
            >
              <h2 id="contact-tip-title" className="font-display text-h3 text-ink" lang={lang}>
                {dict.contactTipHeading}
              </h2>
              <p className="mt-2 text-body leading-relaxed text-ink-soft" lang={lang}>
                {dict.contactTip}
              </p>
              <p className="mt-3 text-caption text-mute" lang={lang}>
                {en ? 'Fastest route: ' : 'छिटो बाटो: '}
                <a href={`mailto:${NEWSROOM_DESKS.news}`} className="font-semibold text-brand" lang="en">
                  {NEWSROOM_DESKS.news}
                </a>
              </p>
            </section>

            <section
              className="border border-rule bg-surface-raised px-4 py-4"
              aria-labelledby="contact-correction-title"
            >
              <h2
                id="contact-correction-title"
                className="font-display text-h3 text-ink"
                lang={lang}
              >
                {dict.contactCorrectionHeading}
              </h2>
              <p className="mt-2 text-body leading-relaxed text-ink-soft" lang={lang}>
                {dict.contactCorrection}
              </p>
              <p className="mt-3 text-caption text-mute" lang={lang}>
                {en ? 'Corrections desk: ' : 'सच्याउ डेस्क: '}
                <a
                  href={`mailto:${NEWSROOM_DESKS.corrections}`}
                  className="font-semibold text-brand"
                  lang="en"
                >
                  {NEWSROOM_DESKS.corrections}
                </a>
              </p>
            </section>
          </div>

          <section
            className="mt-8 border-t border-rule pt-8"
            aria-labelledby="contact-form-title"
          >
            <h2 id="contact-form-title" className="font-display text-h2 text-ink" lang={lang}>
              {en ? 'Send a message' : 'सन्देश पठाउनुहोस्'}
            </h2>
            <p className="mt-2 max-w-2xl text-body text-ink-soft" lang={lang}>
              {en
                ? 'Messages are stored for newsroom review. Sending a message does not guarantee publication or an immediate reply.'
                : 'सन्देश न्युजरुम समीक्षाका लागि सुरक्षित हुन्छ। सन्देश पठाउँदैमा प्रकाशन वा तत्काल जवाफ सुनिश्चित हुँदैन।'}
            </p>
            <div className="mt-5">
              <ContactForm locale={locale} />
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="border border-rule bg-surface-raised px-4 py-4">
            <h2 className="font-display text-h3 text-ink" lang={lang}>
              {en ? 'Newsroom contacts' : 'न्युजरुम सम्पर्क'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            <div className="mt-4 grid gap-4">
              {generalEmail ? (
                <DeskRow
                  label={en ? 'General' : 'सामान्य'}
                  value={generalEmail}
                  lang={lang}
                />
              ) : null}
                <DeskRow
                  label={en ? 'News tips' : 'समाचार टिप'}
                  value={NEWSROOM_DESKS.news}
                  lang={lang}
                />
                <DeskRow
                  label={en ? 'Corrections' : 'सच्याउ अनुरोध'}
                  value={NEWSROOM_DESKS.corrections}
                  lang={lang}
                />
                <DeskRow
                  label={en ? 'Advertising' : 'विज्ञापन'}
                  value={NEWSROOM_DESKS.advertising}
                  lang={lang}
                />
                {phone ? (
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-ink-soft" lang={lang}>
                      {en ? 'Phone' : 'फोन'}
                    </p>
                    <p className="text-meta font-bold tabular-nums text-ink" lang="en">
                      {phone}
                    </p>
                  </div>
                ) : null}
                {address ? (
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-ink-soft" lang={lang}>
                      {en ? 'Address' : 'ठेगाना'}
                    </p>
                    <p className="text-meta leading-relaxed text-ink" lang={lang}>
                      {address}
                    </p>
                  </div>
                ) : null}
              </div>
              <p className="mt-4 border-t border-rule pt-3 text-caption leading-relaxed text-mute" lang={lang}>
                {en
                  ? 'Messages are reviewed on working days within two to three days.'
                  : 'सन्देश कार्यदिनमा दुई तीन दिनभित्र समीक्षा हुन्छ।'}
              </p>
            </div>
        </aside>
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
