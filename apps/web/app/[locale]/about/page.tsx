import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { InfoPageHeader } from '@/components/InfoPage'
import { PUBLICATION, isPublicPublicationValue } from '@/lib/site'

type Params = { locale: string }

/** About page: mission, funding, editorial model and a transparency rail. */
export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const legalName = isPublicPublicationValue(PUBLICATION.legalName) ? PUBLICATION.legalName : ''
  const editorInChief = isPublicPublicationValue(PUBLICATION.editorInChief)
    ? PUBLICATION.editorInChief
    : ''
  const registrationNumber = isPublicPublicationValue(PUBLICATION.registrationNumber)
    ? PUBLICATION.registrationNumber
    : ''
  const hasLegal = Boolean(legalName || editorInChief || registrationNumber)

  const model: Array<{ title: string; body: string }> = [
    {
      title: en ? 'Original reporting' : 'मौलिक रिपोर्टिङ',
      body: en
        ? 'Stories our desk reports, verifies and writes stand on named sources and documents.'
        : 'हाम्रो डेस्कले स्रोत र कागजातसहित जाँचेर तयार पार्ने गरी रिपोर्टिङ गर्छ।',
    },
    {
      title: en ? 'Attributed aggregation' : 'श्रेयसहित सङ्कलन',
      body: en
        ? 'When we curate reporting first published elsewhere, the origin outlet is credited with a link.'
        : 'अर्को स्रोतमा पहिले प्रकाशित समाचार सङ्कलन गर्दा मूल स्रोतलाई लिङ्कसहित श्रेय दिइन्छ।',
    },
    {
      title: en ? 'Analysis and opinion' : 'विश्लेषण र विचार',
      body: en
        ? 'Columns and analysis are clearly labelled and carry the author, not the newsroom, as their voice.'
        : 'स्तम्भ र विश्लेषण स्पष्ट लेबलसहित लेखकको आवाजमा प्रकाशित हुन्छन्।',
    },
  ]

  const policies: Array<{ href: string; label: string }> = [
    { href: '/ethics', label: en ? 'Ethics policy' : 'नैतिक आचारसंहिता' },
    { href: '/editorial-policy', label: en ? 'Editorial policy' : 'सम्पादकीय नीति' },
    { href: '/corrections-policy', label: en ? 'Corrections policy' : 'सच्याउ नीति' },
    { href: '/fact-check-policy', label: en ? 'Fact-check policy' : 'तथ्यजाँच नीति' },
    { href: '/privacy', label: en ? 'Privacy policy' : 'गोपनीयता नीति' },
    { href: '/contact', label: en ? 'Contact the newsroom' : 'न्युजरुम सम्पर्क' },
  ]

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-10">
      <InfoPageHeader
        kicker={dict.aboutKicker}
        title={dict.footerAbout}
        lead={dict.aboutLead}
        lang={lang}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <section aria-labelledby="about-mission">
            <h2 id="about-mission" className="font-display text-h2 text-ink" lang={lang}>
              {dict.aboutMissionHeading}
            </h2>
            <p className="mt-3 max-w-[65ch] text-body leading-relaxed text-ink-soft" lang={lang}>
              {dict.aboutMission}
            </p>
          </section>

          <section className="mt-8" aria-labelledby="about-model">
            <h2 id="about-model" className="font-display text-h2 text-ink" lang={lang}>
              {en ? 'How we work' : 'हामी कसरी काम गर्छौं'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {model.map((item) => (
                <div key={item.title} className="border-t-2 border-brand bg-surface-raised px-4 py-4">
                  <h3 className="font-display text-body font-extrabold text-ink" lang={lang}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-caption leading-relaxed text-ink-soft" lang={lang}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 border-t border-rule pt-8" aria-labelledby="about-funding">
            <h2 id="about-funding" className="font-display text-h2 text-ink" lang={lang}>
              {dict.aboutFundingHeading}
            </h2>
            <p className="mt-3 max-w-[65ch] text-body leading-relaxed text-ink-soft" lang={lang}>
              {dict.aboutFunding}
            </p>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="border border-rule bg-surface-raised px-4 py-4">
            <h2 className="font-display text-h3 text-ink" lang={lang}>
              {en ? 'Transparency' : 'पारदर्शिता'}
            </h2>
            <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
            <ul className="mt-4 grid gap-2.5">
              {policies.map((p) => (
                <li key={p.href}>
                  <Link
                    href={localizeHref(locale, p.href)}
                    className="text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    lang={lang}
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
            {hasLegal ? (
              <div className="mt-4 grid gap-2 border-t border-rule pt-3 text-caption text-ink-soft">
                {legalName ? (
                  <p lang={lang}>
                    {en ? 'Registered as' : 'दर्ता नाम'}: <span className="font-semibold text-ink">{legalName}</span>
                  </p>
                ) : null}
                {editorInChief ? (
                  <p lang={lang}>
                    {en ? 'Editor-in-chief' : 'प्रधान सम्पादक'}:{' '}
                    <span className="font-semibold text-ink">{editorInChief}</span>
                  </p>
                ) : null}
                {registrationNumber ? (
                  <p lang={lang}>
                    {en ? 'DoIB registration' : 'विभाग दर्ता नं'}:{' '}
                    <span className="font-semibold tabular-nums text-ink">{registrationNumber}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
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
    title: dict.footerAbout,
    description: dict.aboutLead,
    alternates: {
      canonical: `${prefix}/about`,
      languages: { ne: '/about', en: `${opposite}/about` },
    },
  }
}
