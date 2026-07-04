import type { Locale } from '@nagarikwatch/db'
import { InfoPageHeader, InfoSection } from '@/components/InfoPage'
import { PUBLICATION } from '@/lib/site'

type TrustPolicyPageProps = {
  locale: Locale
  path: string
  titleNe: string
  titleEn: string
  leadNe: string
  leadEn: string
}

type PolicySection = {
  headingNe: string
  headingEn: string
  bodyNe: string
  bodyEn: string
}

const policySections: Record<string, PolicySection[]> = {
  '/team': [
    {
      headingNe: 'सम्पादकीय जिम्मेवारी',
      headingEn: 'Editorial responsibility',
      bodyNe: 'समाचार, शीर्षक, स्रोत र सच्याइका निर्णय सम्पादकीय टोलीको नियन्त्रणमा रहन्छन्। प्रत्येक प्रकाशित सामग्रीमा बाइलाइन, स्रोत वा एजेन्सी आरोपण देखाइन्छ।',
      bodyEn: 'News, headlines, sourcing and corrections remain under editorial control. Every published item shows a byline, source or agency attribution.',
    },
    {
      headingNe: 'सम्पर्क बिन्दु',
      headingEn: 'Contact point',
      bodyNe: `समाचार टिप, सुधार वा गोपनीय सम्पर्कका लागि ${PUBLICATION.email} प्रयोग गर्नुहोस्। संवेदनशील जानकारी पठाउँदा प्रमाण, मिति र तपाईंले चाहेको गोपनीयता स्तर स्पष्ट लेख्नुहोस्।`,
      bodyEn: `Use ${PUBLICATION.email} for news tips, corrections or confidential contact. For sensitive information, include evidence, dates and the confidentiality level you need.`,
    },
  ],
  '/editorial-policy': [
    {
      headingNe: 'सत्यापन पहिले',
      headingEn: 'Verification first',
      bodyNe: 'हामी कम्तीमा दुई स्वतन्त्र संकेत खोज्छौं, वा एउटै आधिकारिक स्रोत भए त्यसको सीमा पाठकलाई बताउँछौं। अपुष्ट दाबीलाई पुष्ट समाचारको रूपमा प्रकाशित गरिँदैन।',
      bodyEn: 'We seek at least two independent signals, or explain the limits when only one official source is available. Unverified claims are not published as confirmed news.',
    },
    {
      headingNe: 'सम्पादकीय स्वतन्त्रता',
      headingEn: 'Editorial independence',
      bodyNe: 'विज्ञापनदाता, प्रायोजक वा राजनीतिक निकटताले समाचार प्राथमिकता र निष्कर्ष निर्धारण गर्दैनन्। प्रायोजित सामग्री स्पष्ट लेबलसहित मात्र प्रकाशित हुन्छ।',
      bodyEn: 'Advertisers, sponsors or political proximity do not determine news priority or conclusions. Sponsored material is published only with clear labelling.',
    },
  ],
  '/corrections-policy': [
    {
      headingNe: 'त्रुटि स्वीकार्ने तरिका',
      headingEn: 'How we handle errors',
      bodyNe: 'तथ्यात्मक त्रुटि पुष्टि भएपछि लेख अद्यावधिक गरिन्छ र आवश्यक ठाउँमा मिति सहित सच्याइ नोट राखिन्छ। पाठकले इमेलबाट प्रमाणसहित सुधार अनुरोध पठाउन सक्छन्।',
      bodyEn: 'Once a factual error is confirmed, the story is updated and a dated correction note is added where needed. Readers can send evidence-backed correction requests by email.',
    },
    {
      headingNe: 'अभिलेख नलुकाउने',
      headingEn: 'No hidden record',
      bodyNe: 'गम्भीर त्रुटि चुपचाप मेटाइँदैन। हामी के परिवर्तन भयो, किन परिवर्तन भयो र कहिले परिवर्तन भयो भन्ने कुरा पाठकका लागि देखिने बनाउँछौं।',
      bodyEn: 'Material errors are not quietly erased. We make visible what changed, why it changed and when it changed.',
    },
  ],
  '/fact-check-policy': [
    {
      headingNe: 'दाबी, प्रमाण, निष्कर्ष',
      headingEn: 'Claim, evidence, verdict',
      bodyNe: 'तथ्य-जाँचमा दाबी, प्रमाण, स्रोत र निष्कर्ष अलग-अलग देखाइन्छ। प्रमाण अस्पष्ट भए निष्कर्षलाई पनि सीमित वा सन्दर्भ-आवश्यक भनिन्छ।',
      bodyEn: 'Fact checks separate the claim, evidence, sources and verdict. When evidence is unclear, the verdict is limited or marked as needing context.',
    },
    {
      headingNe: 'स्रोत पारदर्शिता',
      headingEn: 'Source transparency',
      bodyNe: 'हामी सकेसम्म प्राथमिक स्रोत, कागजात, सार्वजनिक अभिलेख र प्रत्यक्ष उद्धरण प्रयोग गर्छौं। स्रोत असुरक्षित भए, किन नाम नखुलाइएको हो भन्ने सम्पादकीय कारण राखिन्छ।',
      bodyEn: 'We prefer primary sources, documents, public records and direct quotes. When a source cannot be named safely, the editorial reason is recorded.',
    },
  ],
  '/terms': [
    {
      headingNe: 'सामग्री प्रयोग',
      headingEn: 'Content use',
      bodyNe: 'नागरिक वाचको मौलिक सामग्री स्रोत उल्लेख गरेर छोटो अंश उद्धृत गर्न सकिन्छ। पूरा सामग्री पुनर्प्रकाशनका लागि लिखित अनुमति आवश्यक हुन्छ।',
      bodyEn: 'Short excerpts from original Nagarik Watch work may be quoted with attribution. Full republication requires written permission.',
    },
    {
      headingNe: 'पाठक व्यवहार',
      headingEn: 'Reader conduct',
      bodyNe: 'घृणा, धम्की, व्यक्तिगत आक्रमण, गलत सूचना वा कानुनी जोखिम बढाउने सामग्री टिप्पणी वा सबमिसनमा स्वीकार हुँदैन।',
      bodyEn: 'Hate, threats, personal attacks, misinformation or legally risky material is not accepted in comments or submissions.',
    },
  ],
  '/advertise': [
    {
      headingNe: 'लेबलिङ',
      headingEn: 'Labelling',
      bodyNe: 'विज्ञापन, प्रायोजित सामग्री र नेटिभ सामग्रीलाई सम्पादकीय समाचारसँग मिसाइँदैन। पाठकले तुरुन्त छुट्याउन सक्ने गरी लेबल राखिन्छ।',
      bodyEn: 'Advertisements, sponsored material and native content are not blended with editorial news. Labels are visible enough for readers to distinguish immediately.',
    },
    {
      headingNe: 'सम्पादकीय सीमा',
      headingEn: 'Editorial boundary',
      bodyNe: 'विज्ञापन खरिदले कभरेज, शीर्षक, आलोचना वा निष्कर्षमा अधिकार दिँदैन। विज्ञापन टोली र सम्पादकीय निर्णय अलग रहन्छन्।',
      bodyEn: 'Buying advertising does not grant control over coverage, headlines, criticism or conclusions. Sales work and editorial decisions remain separate.',
    },
  ],
}

const defaultSections: PolicySection[] = [
  {
    headingNe: 'पाठक विश्वास',
    headingEn: 'Reader trust',
    bodyNe: 'हाम्रो आधार सत्यता, स्रोत पारदर्शिता, स्पष्ट भाषा र सच्याइमा इमानदारी हो। कुनै नीति अस्पष्ट भए पाठकको हितलाई प्राथमिकता दिइन्छ।',
    bodyEn: 'Our baseline is accuracy, source transparency, clear language and honest corrections. When a policy is unclear, reader interest comes first.',
  },
]

export function TrustPolicyPage({ locale, path, titleNe, titleEn, leadNe, leadEn }: TrustPolicyPageProps) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const title = locale === 'en' ? titleEn : titleNe
  const lead = locale === 'en' ? leadEn : leadNe
  const sections = policySections[path] ?? defaultSections

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <InfoPageHeader kicker={title} lead={lead} lang={lang} />
      <div className="mt-10 grid gap-8">
        {sections.map((section) => (
          <InfoSection key={section.headingEn} heading={locale === 'en' ? section.headingEn : section.headingNe} lang={lang}>
            {locale === 'en' ? section.bodyEn : section.bodyNe}
          </InfoSection>
        ))}
      </div>
      <section className="mt-10 rounded-lg border border-rule bg-brand-tint p-5" lang={lang}>
        <h2 className="font-display text-h3 text-ink">
          {locale === 'en' ? 'Publication transparency' : 'प्रकाशन पारदर्शिता'}
        </h2>
        <dl className="mt-3 grid gap-3 text-body text-ink-soft md:grid-cols-2">
          <TransparencyItem label="Publisher" value={PUBLICATION.publisherName} />
          {PUBLICATION.legalName ? <TransparencyItem label="Legal name" value={PUBLICATION.legalName} /> : null}
          {PUBLICATION.editorInChief ? <TransparencyItem label="Editor" value={PUBLICATION.editorInChief} /> : null}
          {PUBLICATION.registrationNumber ? <TransparencyItem label="Registration" value={PUBLICATION.registrationNumber} /> : null}
          <TransparencyItem label="Address" value={PUBLICATION.address} />
          <TransparencyItem label="Contact" value={PUBLICATION.email} />
        </dl>
      </section>
    </div>
  )
}

function TransparencyItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-ink" lang="en">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  )
}
