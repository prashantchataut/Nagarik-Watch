import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { InfoPageHeader, InfoSection } from '@/components/InfoPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { NEWSROOM_DESKS } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Help & reader support' : 'सहायता र पाठक सेवा',
    description: en
      ? 'Help with reading, saved stories, corrections, tips, utilities and account access.'
      : 'पढाइ, सुरक्षित समाचार, सच्याइ, समाचार टिप, उपयोगी सेवा र खातासम्बन्धी सहायता।',
    alternates: canonicalAlternates(locale, '/help'),
  }
}

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const groups = [
    {
      title: en ? 'Reading & account' : 'पढाइ र खाता',
      links: [
        ['/saved', en ? 'Saved stories' : 'सुरक्षित समाचार'],
        ['/auth/profile', en ? 'Account and profile' : 'खाता र प्रोफाइल'],
        ['/search', en ? 'Search the archive' : 'अभिलेख खोज्नुहोस्'],
      ],
    },
    {
      title: en ? 'Public-service tools' : 'सार्वजनिक उपयोगी सेवा',
      links: [
        ['/patro', en ? 'Nepali calendar' : 'नेपाली पात्रो'],
        ['/market', en ? 'Markets, gold and forex' : 'बजार, सुनचाँदी र मुद्रा'],
        ['/live-scores', en ? 'Verified live scores' : 'प्रमाणित लाइभ स्कोर'],
        ['/utilities', en ? 'All utilities' : 'सबै उपयोगी उपकरण'],
      ],
    },
  ] as const

  return (
    <div className="help-page mx-auto max-w-page px-4 py-10 sm:py-14" lang={lang}>
      <InfoPageHeader
        kicker={en ? 'Reader support' : 'पाठक सहायता'}
        title={en ? 'How can we help?' : 'हामी कसरी सहयोग गर्न सक्छौँ?'}
        lead={
          en
            ? 'Use the direct route for reading problems, account access, corrections, news tips and public-service tools. No ticket maze.'
            : 'पढाइ, खाता, सच्याइ, समाचार टिप र सार्वजनिक उपयोगी सेवाका लागि सिधै सही बाटो रोज्नुहोस्। अनावश्यक टिकट प्रणाली छैन।'
        }
        lang={lang}
      />

      <div className="mx-auto mt-9 grid max-w-[72rem] gap-x-12 gap-y-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)]">
        <div>
          {groups.map((group) => (
            <InfoSection key={group.title} heading={group.title} lang={lang}>
              <ul className="help-link-list border-t border-rule">
                {group.links.map(([href, label]) => (
                  <li key={href} className="border-b border-rule">
                    <Link
                      href={localizeHref(locale, href)}
                      className="group flex min-h-14 items-center justify-between gap-4 py-3 font-display text-body font-extrabold text-ink transition-colors hover:text-brand-strong"
                    >
                      {label}
                      <span aria-hidden="true" className="text-brand-strong">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </InfoSection>
          ))}

          <InfoSection heading={en ? 'Corrections & news tips' : 'सच्याइ र समाचार टिप'} lang={lang}>
            <p>
              {en
                ? 'For a factual correction, identify the story and the specific claim. For a confidential news tip, include what can be independently verified and how the newsroom may contact you.'
                : 'तथ्यगत सच्याइका लागि समाचार र सच्याउनुपर्ने ठ्याक्कै दाबी उल्लेख गर्नुहोस्। गोप्य समाचार टिपमा स्वतन्त्र रूपमा पुष्टि गर्न सकिने विवरण र न्युजरुमले तपाईंलाई सम्पर्क गर्ने माध्यम दिनुहोस्।'}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta font-bold">
              <a className="text-brand-strong" href={`mailto:${NEWSROOM_DESKS.corrections}`} lang="en">
                {NEWSROOM_DESKS.corrections}
              </a>
              <a className="text-brand-strong" href={`mailto:${NEWSROOM_DESKS.news}`} lang="en">
                {NEWSROOM_DESKS.news}
              </a>
            </div>
          </InfoSection>
        </div>

        <aside className="border-t border-rule pt-5 lg:sticky lg:top-24 lg:self-start" aria-label={en ? 'Need more help' : 'थप सहायता'}>
          <p className="font-display text-h3 font-extrabold text-ink">
            {en ? 'Still need a person?' : 'अझै प्रत्यक्ष सहयोग चाहिन्छ?'}
          </p>
          <p className="mt-2 text-body leading-relaxed text-ink-soft">
            {en
              ? 'Use the contact form for a message that does not fit the routes above. Advertising requests have a separate commercial desk.'
              : 'माथिका बाटोमा नपर्ने सन्देशका लागि सम्पर्क फारम प्रयोग गर्नुहोस्। विज्ञापन अनुरोधका लागि छुट्टै व्यावसायिक डेस्क छ।'}
          </p>
          <div className="mt-4 grid gap-2 border-y border-rule py-3 text-meta font-bold">
            <Link href={localizeHref(locale, '/contact')} className="text-brand-strong">
              {en ? 'Contact the newsroom →' : 'न्युजरुम सम्पर्क →'}
            </Link>
            <Link href={localizeHref(locale, '/advertise')} className="text-brand-strong">
              {en ? 'Advertising desk →' : 'विज्ञापन डेस्क →'}
            </Link>
            <Link href={localizeHref(locale, '/privacy')} className="text-brand-strong">
              {en ? 'Privacy & data →' : 'गोपनीयता र डाटा →'}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
