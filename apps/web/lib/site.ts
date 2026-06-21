import type { Locale } from '@nagarikwatch/db'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const PUBLICATION = {
  publisherName: 'Nagarik Watch Media',
  legalName: 'Nagarik Watch Media Pvt. Ltd. (placeholder)',
  editorInChief: 'Editor-in-Chief (to be appointed)',
  registrationStatus: process.env.NEXT_PUBLIC_DOIB_NUMBER || 'DoIB registration pending',
  address: 'Kathmandu, Nepal (final newsroom address pending)',
  email: 'contact@nagarikwatch.com',
  phone: '+977-01-0000000 (placeholder)',
  ownership: 'Privately held Nepali media company. Final ownership disclosure pending legal setup.',
  logoPath: '/icon.svg',
} as const

export type StaticHubKey =
  | 'latest'
  | 'trending'
  | 'most-read'
  | 'editor-picks'
  | 'exclusive'
  | 'fact-check'
  | 'opinion'
  | 'reader-corner'
  | 'market'
  | 'sports'
  | 'sports-live'
  | 'election'
  | 'results'
  | 'disaster-alerts'
  | 'video'
  | 'photos'
  | 'data-stories'
  | 'archive'
  | 'submit-story'
  | 'membership'

export type StaticHub = {
  key: StaticHubKey
  path: string
  titleNe: string
  titleEn: string
  leadNe: string
  leadEn: string
  mode: 'latest' | 'trending' | 'editorial' | 'utility' | 'community'
}

export const STATIC_HUBS: StaticHub[] = [
  {
    key: 'latest',
    path: '/latest',
    titleNe: 'ताजा समाचार',
    titleEn: 'Latest News',
    leadNe: 'नागरिक वाचमा प्रकाशित सबैभन्दा नयाँ समाचार, अद्यावधिक र विश्लेषण।',
    leadEn: 'The newest Nagarik Watch stories, updates and analysis.',
    mode: 'latest',
  },
  {
    key: 'trending',
    path: '/trending',
    titleNe: 'ट्रेन्डिङ',
    titleEn: 'Trending',
    leadNe: 'पढाइ, ताजापन र सम्पादकीय प्राथमिकताको मिश्रित संकेतबाट बनेको ट्रेन्डिङ सूची।',
    leadEn: 'A trending list shaped by freshness, reading signals and editorial judgement.',
    mode: 'trending',
  },
  {
    key: 'most-read',
    path: '/most-read',
    titleNe: 'धेरै पढिएको',
    titleEn: 'Most Read',
    leadNe: 'वास्तविक एनालिटिक्स जोडिएपछि यो सूची पाठकको पढाइका आधारमा स्वचालित हुनेछ।',
    leadEn: 'This list will be driven by reader analytics once production tracking is connected.',
    mode: 'trending',
  },
  {
    key: 'editor-picks',
    path: '/editor-picks',
    titleNe: 'सम्पादकको रोजाइ',
    titleEn: "Editor's Picks",
    leadNe: 'सम्पादकीय टोलीले महत्व, सार्वजनिक हित र सन्दर्भका आधारमा छानेका कथा।',
    leadEn: 'Stories selected by editors for public interest, importance and context.',
    mode: 'editorial',
  },
  {
    key: 'exclusive',
    path: '/exclusive',
    titleNe: 'विशेष रिपोर्ट',
    titleEn: 'Exclusive Reports',
    leadNe: 'मौलिक रिपोर्टिङ, अनुसन्धान र नागरिक सरोकारका विशेष सामग्रीका लागि तयार गरिएको खण्ड।',
    leadEn: 'A home for original reporting, investigations and public-interest exclusives.',
    mode: 'editorial',
  },
  {
    key: 'fact-check',
    path: '/fact-check',
    titleNe: 'तथ्य-जाँच',
    titleEn: 'Fact Check',
    leadNe: 'दाबी, प्रमाण, निष्कर्ष र सच्याइको स्पष्ट संरचनासहितका तथ्य-जाँच सामग्री।',
    leadEn: 'Fact-check articles with visible claims, evidence, verdicts and corrections.',
    mode: 'editorial',
  },
  {
    key: 'reader-corner',
    path: '/reader-corner',
    titleNe: 'पाठक मञ्च',
    titleEn: "Reader's Corner",
    leadNe: 'सम्पादकीय स्वीकृतिपछि मात्र प्रकाशित हुने पाठक सामग्रीका लागि सुरक्षित स्थान।',
    leadEn: 'A moderated space for reader submissions that publish only after editorial approval.',
    mode: 'community',
  },
  {
    key: 'market',
    path: '/market',
    titleNe: 'बजार र सेयर',
    titleEn: 'Market and Shares',
    leadNe: 'NEPSE, सुनचाँदी, विदेशी मुद्रा र अर्थतन्त्रका लाइभ डाटा विजेटका लागि संरचित खण्ड।',
    leadEn: 'Structured hub for NEPSE, bullion, forex and economy live-data widgets.',
    mode: 'utility',
  },
  {
    key: 'sports-live',
    path: '/sports/live',
    titleNe: 'लाइभ खेल',
    titleEn: 'Live Sports',
    leadNe: 'स्कोर, फिक्स्चर र प्रतियोगिता तालिका जोड्न तयार लाइभ खेल पृष्ठ।',
    leadEn: 'A live sports page prepared for scores, fixtures and tournament tables.',
    mode: 'utility',
  },
  {
    key: 'election',
    path: '/election',
    titleNe: 'निर्वाचन',
    titleEn: 'Election',
    leadNe: 'निर्वाचन परिणाम, मतगणना र क्षेत्रगत विश्लेषणका लागि भविष्य-तयार खण्ड।',
    leadEn: 'A future-ready hub for election results, counts and constituency analysis.',
    mode: 'utility',
  },
  {
    key: 'results',
    path: '/results',
    titleNe: 'नतिजा',
    titleEn: 'Results',
    leadNe: 'SEE, कक्षा १२ र सार्वजनिक परीक्षाफलका आधिकारिक स्रोत जोड्न तयार पृष्ठ।',
    leadEn: 'Prepared for SEE, Grade XII and public-result integrations from official sources.',
    mode: 'utility',
  },
  {
    key: 'disaster-alerts',
    path: '/disaster-alerts',
    titleNe: 'विपद् सूचना',
    titleEn: 'Disaster Alerts',
    leadNe: 'विपद् चेतावनी, आपतकालीन सूचना र सार्वजनिक सावधानीका लागि गैर-अवरोधक विजेट।',
    leadEn: 'Non-blocking widgets for disaster warnings, emergency notices and public alerts.',
    mode: 'utility',
  },
  {
    key: 'video',
    path: '/video',
    titleNe: 'भिडियो',
    titleEn: 'Video',
    leadNe: 'समाचार भिडियो, अन्तर्वार्ता, व्याख्या र लाइभ एम्बेडका लागि मीडिया खण्ड।',
    leadEn: 'A media section for news video, interviews, explainers and live embeds.',
    mode: 'editorial',
  },
  {
    key: 'photos',
    path: '/photos',
    titleNe: 'फोटो कथा',
    titleEn: 'Photo Stories',
    leadNe: 'फोटो पत्रकारिता, दृश्य कथा र ग्यालरी सामग्रीका लागि संरचित पृष्ठ।',
    leadEn: 'Structured page for photojournalism, visual stories and galleries.',
    mode: 'editorial',
  },
  {
    key: 'data-stories',
    path: '/data-stories',
    titleNe: 'डाटा कथा',
    titleEn: 'Data Stories',
    leadNe: 'डाटा, ग्राफ, तालिका र पद्धतिसहितका व्याख्यात्मक रिपोर्टका लागि खण्ड।',
    leadEn: 'A section for data-led reporting with charts, tables and methodology notes.',
    mode: 'editorial',
  },
  {
    key: 'archive',
    path: '/archive',
    titleNe: 'अभिलेख',
    titleEn: 'Archive',
    leadNe: 'मिति, विभाग, लेखक र विषयका आधारमा पुराना सामग्री खोज्न तयार अभिलेख।',
    leadEn: 'Archive scaffold for browsing by date, section, author and topic.',
    mode: 'latest',
  },
  {
    key: 'submit-story',
    path: '/submit-story',
    titleNe: 'समाचार टिप पठाउनुहोस्',
    titleEn: 'Submit a Story Tip',
    leadNe: 'तथ्य, प्रमाण र सहमति सहितको पाठक टिप संकलनका लागि सुरक्षित फारम स्काफोल्ड।',
    leadEn: 'A safe form scaffold for reader tips with evidence, consent and moderation.',
    mode: 'community',
  },
  {
    key: 'membership',
    path: '/membership',
    titleNe: 'सदस्यता तयारी',
    titleEn: 'Membership Readiness',
    leadNe: 'भविष्यको सदस्यता, सहयोग र प्रिमियम संकेतका लागि पारदर्शी संरचना।',
    leadEn: 'Transparent scaffolding for future membership, support and premium signals.',
    mode: 'community',
  },
]

export const TRUST_PAGES = [
  {
    path: '/team',
    titleNe: 'हाम्रो टोली',
    titleEn: 'Team',
    leadNe: 'सम्पादकीय र व्यवसायिक टोलीको अन्तिम सूची प्रकाशन अघि कानुनी रूपमा पुष्टि गर्नुपर्छ।',
    leadEn: 'The final editorial and business team list must be legally confirmed before launch.',
  },
  {
    path: '/editorial-policy',
    titleNe: 'सम्पादकीय नीति',
    titleEn: 'Editorial Policy',
    leadNe: 'सत्यता, सन्तुलन, स्रोत, स्वार्थको द्वन्द्व र सुधार प्रक्रियाका नियम।',
    leadEn: 'Rules for accuracy, balance, sourcing, conflicts and corrections.',
  },
  {
    path: '/corrections-policy',
    titleNe: 'सच्याइ नीति',
    titleEn: 'Corrections Policy',
    leadNe: 'त्रुटि स्वीकार्ने, सच्याउने र पाठकलाई देखिने गरी अभिलेख राख्ने प्रक्रिया।',
    leadEn: 'How errors are accepted, corrected and logged visibly for readers.',
  },
  {
    path: '/fact-check-policy',
    titleNe: 'तथ्य-जाँच नीति',
    titleEn: 'Fact-Check Policy',
    leadNe: 'दाबी, प्रमाण, स्रोत र निष्कर्ष अलग-अलग देखाउने तथ्य-जाँच पद्धति।',
    leadEn: 'Fact-check method for separating claims, evidence, sources and verdicts.',
  },
  {
    path: '/terms',
    titleNe: 'प्रयोग सर्त',
    titleEn: 'Terms',
    leadNe: 'साइट प्रयोग, सामग्री अधिकार, टिप्पणी र सेवाका सर्तको प्रारम्भिक मस्यौदा।',
    leadEn: 'Initial draft for site use, content rights, comments and service terms.',
  },
  {
    path: '/advertise',
    titleNe: 'विज्ञापन',
    titleEn: 'Advertise',
    leadNe: 'प्रत्यक्ष विज्ञापन, प्रायोजित सामग्री र पारदर्शी लेबलिङका नियम।',
    leadEn: 'Rules for direct advertising, sponsored content and clear labelling.',
  },
] as const

export function hubByPath(path: string): StaticHub | undefined {
  return STATIC_HUBS.find((hub) => hub.path === path)
}

export function localizedTitle(locale: Locale, item: { titleNe: string; titleEn: string }) {
  return locale === 'en' ? item.titleEn : item.titleNe
}

export function localizedLead(locale: Locale, item: { leadNe: string; leadEn: string }) {
  return locale === 'en' ? item.leadEn : item.leadNe
}
