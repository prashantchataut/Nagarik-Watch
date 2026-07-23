import type { Locale } from '@nagarikwatch/db'

function normalizeOrigin(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim().replace(/\/$/, '')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

/**
 * Canonical public origin for metadata, feeds, and auth redirects.
 * Prefer an explicit NEXT_PUBLIC_SITE_URL; fall back to platform preview URLs so
 * Cloudflare Pages / Vercel CI can collect page data without failing the build.
 */
function requiredSiteUrl(): string {
  const configured =
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeOrigin(process.env.SITE_URL) ||
    normalizeOrigin(process.env.BETTER_AUTH_URL) ||
    normalizeOrigin(process.env.CF_PAGES_URL) ||
    normalizeOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeOrigin(process.env.VERCEL_URL)

  if (configured) return configured

  if (
    process.env.CF_PAGES === '1' ||
    process.env.CF_PAGES_STATIC === '1' ||
    process.env.CF_WORKERS === '1'
  ) {
    return 'https://nagarik-watch.pages.dev'
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL is required in production (set the canonical public origin).',
    )
  }
  return 'http://localhost:3000'
}

export const SITE_URL = requiredSiteUrl().replace(/\/$/, '')

export const PUBLICATION = {
  publisherName: process.env.NEXT_PUBLIC_PUBLICATION_NAME?.trim() || 'Nagarik Watch',
  legalName: process.env.NEXT_PUBLIC_PUBLICATION_LEGAL_NAME?.trim() || '',
  editorInChief: process.env.NEXT_PUBLIC_EDITOR_IN_CHIEF?.trim() || '',
  registrationNumber: process.env.NEXT_PUBLIC_DOIB_NUMBER?.trim() || '',
  address: process.env.NEXT_PUBLIC_NEWSROOM_ADDRESS?.trim() || '',
  email: process.env.NEXT_PUBLIC_NEWSROOM_EMAIL?.trim() || 'contact@nagarikwatch.com',
  phone: process.env.NEXT_PUBLIC_NEWSROOM_PHONE?.trim() || '',
  ownership:
    'Nagarik Watch separates editorial, opinion, advertising and sponsored material. Corrections are recorded on article and policy pages.',
  logoPath: '/icon.svg',
} as const

/** Hide unverified launch placeholders from the public footer/chrome. */
export function isPublicPublicationValue(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

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
  | 'utilities'
  | 'rashifal'
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
    leadNe: 'पढाइ र टिप्पणी गतिमा आधारित लाइभ ट्रेन्डिङ। सिग्नल कम भए ताजाता र सम्पादकीय प्राथमिकतामा झर्छ।',
    leadEn: 'Live trending from first-party reads and comment velocity. Quiet periods fall back to freshness and editorial priority.',
    mode: 'trending',
  },
  {
    key: 'most-read',
    path: '/most-read',
    titleNe: 'धेरै पढिएको',
    titleEn: 'Most Read',
    leadNe: 'पछिल्लो सात दिनका भिन्न पाठक र पढाइ गहिराइका आधारमा; पर्याप्त डाटा नहुँदा ताजा सूची।',
    leadEn: 'Ranked by unique readers and reading depth over seven days; falls back to newest when sample size is thin.',
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
    leadNe: 'मौलिक रिपोर्टिङ, अनुसन्धान र सार्वजनिक सरोकारका विशेष सामग्री।',
    leadEn: 'Original reporting, investigations and public-interest exclusives.',
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
    leadNe: 'NEPSE, सुनचाँदी, विदेशी मुद्रा र अर्थतन्त्रका अद्यावधिक डाटा।',
    leadEn: 'Updated data for NEPSE, bullion, forex and the economy.',
    mode: 'utility',
  },
  {
    key: 'utilities',
    path: '/utilities',
    titleNe: 'उपयोगी सेवा',
    titleEn: 'Utilities',
    leadNe: 'पात्रो, मिति रूपान्तरण, टाइपिङ, बजार र दैनिक उपयोगी उपकरण।',
    leadEn: 'Calendar, date conversion, typing, market and daily reader tools.',
    mode: 'utility',
  },
  {
    key: 'rashifal',
    path: '/rashifal',
    titleNe: 'राशिफल',
    titleEn: 'Horoscope',
    leadNe: 'आजको दैनिक राशिफल — १२ राशिको भविष्यवाणी, भाग्य अंक र रंग।',
    leadEn: 'Today’s daily horoscope — forecasts for all 12 signs, lucky numbers and colors.',
    mode: 'utility',
  },
  {
    key: 'sports-live',
    path: '/sports/live',
    titleNe: 'लाइभ खेल',
    titleEn: 'Live Sports',
    leadNe: 'क्रिकेट र फुटबल पछ्याउने नेपाली पाठकका लागि स्कोर, फिक्स्चर र खेल व्याख्या।',
    leadEn:
      'Scores, fixtures and match explainers for Nepali readers who follow cricket and football closely.',
    mode: 'utility',
  },
  {
    key: 'election',
    path: '/election',
    titleNe: 'निर्वाचन',
    titleEn: 'Election',
    leadNe:
      'विश्वसनीय परिणाम ट्र्याकिङ चाहिने समयमा निर्वाचन समाचार, मतगणना सन्दर्भ र क्षेत्रगत व्याख्या।',
    leadEn:
      'Election news, vote-count context and constituency explainers when the public needs reliable result tracking.',
    mode: 'utility',
  },
  {
    key: 'results',
    path: '/results',
    titleNe: 'नतिजा',
    titleEn: 'Results',
    leadNe: 'SEE, कक्षा १२ र सार्वजनिक परीक्षाका आधिकारिक सूचना, नतिजा व्याख्या र पाठक मार्गदर्शन।',
    leadEn:
      'Official-result explainers, notices and reader guidance for SEE, Grade XII and public examinations.',
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
    leadNe: 'मिति, विभाग, लेखक र विषयका आधारमा पुराना नागरिक वाच सामग्री खोज्नुहोस्।',
    leadEn: 'Browse older Nagarik Watch stories by date, section, author and topic.',
    mode: 'latest',
  },
  {
    key: 'submit-story',
    path: '/submit-story',
    titleNe: 'समाचार टिप पठाउनुहोस्',
    titleEn: 'Submit a Story Tip',
    leadNe: 'प्रमाण, स्रोत सन्दर्भ र सम्पर्क विवरणसहित समाचार टिप पठाउने सुरक्षित बाटो।',
    leadEn:
      'Send a news tip with evidence, source context and a clear way for the newsroom to follow up.',
    mode: 'community',
  },
  {
    key: 'membership',
    path: '/membership',
    titleNe: 'सदस्यता तयारी',
    titleEn: 'Membership Readiness',
    leadNe: 'पाठक सहयोग, सदस्यता योजना र लाभ स्पष्ट पार्ने पृष्ठ।',
    leadEn: 'Reader-support and membership information with clear benefits and limits.',
    mode: 'community',
  },
]

export const TRUST_PAGES = [
  {
    path: '/team',
    titleNe: 'हाम्रो टोली',
    titleEn: 'Team',
    leadNe:
      'नागरिक वाचका सम्पादकीय जिम्मेवारी, सम्पर्क बिन्दु र प्रकाशन भूमिकाबारे पारदर्शी जानकारी।',
    leadEn:
      'Transparent information about Nagarik Watch editorial responsibility, contact points and publication roles.',
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
    leadNe: 'साइट प्रयोग, सामग्री अधिकार, टिप्पणी र सेवाका सर्त।',
    leadEn: 'Terms for site use, content rights, comments and services.',
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

/** Nepal's seven provinces. The province mega-menu and /province/[slug] pages
 *  key off this list; the slug matches the dynamic route and the sitemap. */
export const PROVINCES = [
  { slug: 'koshi', nameNe: 'कोशी', nameEn: 'Koshi' },
  { slug: 'madhesh', nameNe: 'मधेश', nameEn: 'Madhesh' },
  { slug: 'bagmati', nameNe: 'बागमती', nameEn: 'Bagmati' },
  { slug: 'gandaki', nameNe: 'गण्डकी', nameEn: 'Gandaki' },
  { slug: 'lumbini', nameNe: 'लुम्बिनी', nameEn: 'Lumbini' },
  { slug: 'karnali', nameNe: 'कर्णाली', nameEn: 'Karnali' },
  { slug: 'sudurpashchim', nameNe: 'सुदूरपश्चिम', nameEn: 'Sudurpashchim' },
] as const

/** Secondary nav rail — utility hubs a national portal surfaces above the
 *  section nav. Drawn from STATIC_HUBS so the rail stays in sync with the hub registry. */
/** @deprecated Prefer TOPICS_STRIP_HUBS + utility tools in masthead. Kept for any legacy imports. */
export const SECONDARY_NAV_HUBS = [
  'market',
  'utilities',
  'sports-live',
  'election',
  'disaster-alerts',
  'video',
  'photos',
] as const satisfies readonly (typeof STATIC_HUBS)[number]['key'][]

/** Ratopati-style topics strip under primary nav. Curated desks first; live tags append in PublicShell. */
export const TOPICS_STRIP_HUBS = [
  'latest',
  'trending',
  'most-read',
  'exclusive',
  'fact-check',
  'market',
  'rashifal',
] as const satisfies readonly (typeof STATIC_HUBS)[number]['key'][]

export function localizedLead(locale: Locale, item: { leadNe: string; leadEn: string }) {
  return locale === 'en' ? item.leadEn : item.leadNe
}
