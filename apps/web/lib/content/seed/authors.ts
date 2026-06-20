import type { Author } from '@nagarikwatch/db'

/** Seed authors and columnists (content-model.md §3). Fictional bylines for the seed. */
export const authors: Author[] = [
  {
    id: 'aut-srijana',
    slug: 'srijana-karki',
    name: 'श्रीजना कार्की',
    role: 'staff',
    bioNe: 'श्रीजना कार्की राजनीति शाखाकी वरिष्ठ पत्रकार हुन्, संसद् र शासनप्रशासनमा विशेष रुचि।',
    bioEn:
      'Srijana Karki is a senior reporter on the politics desk, focused on parliament and governance.',
    isActive: true,
    social: { twitter: 'https://twitter.com/' },
  },
  {
    id: 'aut-bishal',
    slug: 'bishal-thapa',
    name: 'बिशाल थापा',
    role: 'staff',
    bioNe: 'बिशाल थापा अर्थतन्त्र र बजारका समाचार तयार गर्छन्।',
    bioEn: 'Bishal Thapa covers the economy and markets.',
    isActive: true,
  },
  {
    id: 'aut-anjana',
    slug: 'anjana-ghimire',
    name: 'अन्जना घिमिरे',
    role: 'staff',
    bioNe: 'अन्जना घिमिरे समाज शाखाकी पत्रकार हुन्, शिक्षा र स्वास्थ्यमा केन्द्रित।',
    bioEn: 'Anjana Ghimire reports on society, with a focus on education and health.',
    isActive: true,
  },
  {
    id: 'aut-roshan',
    slug: 'roshan-maharjan',
    name: 'रोशन महर्जन',
    role: 'staff',
    bioNe: 'रोशन महर्जन खेलकुद समाचार सम्पादक हुन्।',
    bioEn: 'Roshan Maharjan is the sports desk editor.',
    isActive: true,
  },
  {
    id: 'aut-prakash',
    slug: 'prakash-bhattarai',
    name: 'प्रकाश भट्टराई',
    role: 'columnist',
    bioNe: 'प्रकाश भट्टराई लोकतान्त्रिक संस्था र विदेशी नीतिमा लेख्छन्।',
    bioEn: 'Prakash Bhattarai writes on democratic institutions and foreign policy.',
    isActive: true,
  },
  {
    id: 'aut-meera',
    slug: 'meera-rajbhandari',
    name: 'मीरा राजभण्डारी',
    role: 'columnist',
    bioNe: 'मीरा राजभण्डारी संस्कृति, चलचित्र र सहरी जीवनमा लेख्छिन्।',
    bioEn: 'Meera Rajbhandari writes on culture, film and urban life.',
    isActive: true,
  },
  {
    id: 'aut-diaspora',
    slug: 'hemant-rijal',
    name: 'हेमन्त रिजाल',
    role: 'contributor',
    bioNe: 'हेमन्त रिजाल खाडी मुलुकका नेपाली प्रवासका बारेमा लेख्छन्।',
    bioEn: 'Hemant Rijal writes about the Nepali diaspora in the Gulf.',
    isActive: true,
  },
  {
    id: 'aut-agency',
    slug: 'agency-report',
    name: 'एजेन्सी रिपोर्ट',
    role: 'wire',
    bioNe: 'समाचार एजेन्सीबाट संकलित तारा सामग्री।',
    bioEn: 'Wire copy from partner news agencies.',
    isActive: true,
  },
]

export const authorById = new Map(authors.map((a) => [a.id, a]))
export const authorBySlug = new Map(authors.map((a) => [a.slug, a]))
