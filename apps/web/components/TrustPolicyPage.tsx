import type { Locale } from '@nagarikwatch/db'
import { InfoPageHeader, InfoSection } from '@/components/InfoPage'
import { PUBLICATION } from '@/lib/site'

export function TrustPolicyPage({
  locale,
  titleNe,
  titleEn,
  leadNe,
  leadEn,
}: {
  locale: Locale
  titleNe: string
  titleEn: string
  leadNe: string
  leadEn: string
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const title = locale === 'en' ? titleEn : titleNe
  const lead = locale === 'en' ? leadEn : leadNe
  const sections = locale === 'en' ? englishSections : nepaliSections

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <InfoPageHeader kicker={title} lead={lead} lang={lang} />
      <div className="mt-10 grid gap-8">
        {sections.map((section) => (
          <InfoSection key={section.heading} heading={section.heading} lang={lang}>
            {section.body}
          </InfoSection>
        ))}
      </div>
      <section className="mt-10 rounded-lg border border-rule bg-brand-tint p-5" lang={lang}>
        <h2 className="font-display text-h3 text-ink">
          {locale === 'en' ? 'Publication transparency' : 'प्रकाशन पारदर्शिता'}
        </h2>
        <dl className="mt-3 grid gap-2 text-body text-ink-soft md:grid-cols-2">
          <div>
            <dt className="font-semibold text-ink">Publisher</dt>
            <dd>{PUBLICATION.publisherName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Legal name</dt>
            <dd>{PUBLICATION.legalName}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Editor</dt>
            <dd>{PUBLICATION.editorInChief}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Registration</dt>
            <dd>{PUBLICATION.registrationStatus}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Address</dt>
            <dd>{PUBLICATION.address}</dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Contact</dt>
            <dd>{PUBLICATION.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

const nepaliSections = [
  {
    heading: 'म्यानुअल सम्पादन आवश्यक',
    body: 'यो पृष्ठ उत्पादन-तयार संरचना हो, तर कानुनी नाम, दर्ता नम्बर, सम्पादक, ठेगाना र नीतिगत भाषा प्रकाशन अघि मानव सम्पादक र कानुनी सल्लाहकारले अन्तिम गर्नुपर्छ।',
  },
  {
    heading: 'स्रोत र सुधार',
    body: 'हामी दाबीको स्रोत देखाउँछौं, त्रुटि भेटिएमा सच्याइ नोट थप्छौं र प्रायोजित सामग्रीलाई सम्पादकीय सामग्रीबाट स्पष्ट रूपमा अलग राख्छौं।',
  },
  {
    heading: 'AI प्रयोग',
    body: 'AI साधनले सारांश, शीर्षक वा ट्याग सुझाव दिन सक्छ, तर कुनै सामग्री मानव सम्पादकको स्वीकृति बिना प्रकाशित हुँदैन।',
  },
]

const englishSections = [
  {
    heading: 'Manual editorial review required',
    body: 'This page is production-ready structure, but legal name, registration number, editor, address and policy language must be finalized by a human editor and legal adviser before launch.',
  },
  {
    heading: 'Sources and corrections',
    body: 'We show sources for claims, add correction notes when errors are found, and clearly separate sponsored content from editorial coverage.',
  },
  {
    heading: 'AI use',
    body: 'AI tools may suggest summaries, headlines or tags, but no material is published without approval from a human editor.',
  },
]
