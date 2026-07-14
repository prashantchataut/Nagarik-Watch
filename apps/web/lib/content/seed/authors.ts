import type { Author } from '@nagarikwatch/db'

/**
 * Development taxonomy only.
 *
 * These are newsroom desk identities, not fictional people. Real journalists
 * must be created in Payload with verified names, bios, photos, and contact
 * details before their bylines are used publicly.
 */
export const authors: Author[] = [
  {
    id: 'aut-newsroom-desk',
    slug: 'nagarik-watch-desk',
    name: 'नागरिक वाच डेस्क',
    role: 'staff',
    bioNe: 'नागरिक वाचको साझा समाचार कक्ष पहिचान। व्यक्तिगत रिपोर्टिङमा सम्बन्धित पत्रकारको वास्तविक बाइलाइन प्रयोग गरिन्छ।',
    bioEn:
      'The shared Nagarik Watch newsroom identity. Individually reported work must use the verified reporter byline.',
    email: 'newsroom@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
  {
    id: 'aut-fact-check-desk',
    slug: 'fact-check-desk',
    name: 'तथ्य जाँच डेस्क',
    role: 'staff',
    bioNe: 'दाबी, प्रमाण, स्रोत र सन्दर्भको व्यवस्थित परीक्षण गर्ने सम्पादकीय डेस्क।',
    bioEn: 'The editorial desk responsible for checking claims, evidence, sources and context.',
    email: 'factcheck@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
  {
    id: 'aut-data-desk',
    slug: 'data-desk',
    name: 'डाटा डेस्क',
    role: 'staff',
    bioNe: 'सार्वजनिक तथ्यांक, पद्धति र दृश्य प्रमाणमा आधारित सामग्री तयार गर्ने डेस्क।',
    bioEn: 'The desk producing work based on public data, transparent methods and visual evidence.',
    email: 'data@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
  {
    id: 'aut-province-desk',
    slug: 'province-desk',
    name: 'प्रदेश डेस्क',
    role: 'staff',
    bioNe: 'प्रदेश र स्थानीय तहका सार्वजनिक सरोकारका विषय समेट्ने समन्वय डेस्क।',
    bioEn: 'The coordination desk for province and local public-interest coverage.',
    email: 'province@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
  {
    id: 'aut-reader-desk',
    slug: 'reader-desk',
    name: 'पाठक डेस्क',
    role: 'contributor',
    bioNe: 'सम्पादकीय परीक्षणपछि स्वीकार गरिएका पाठक सूचना, प्रश्न र सार्वजनिक सरोकारका सामग्री व्यवस्थापन गर्ने डेस्क।',
    bioEn: 'The desk handling reader tips, questions and public-interest submissions after editorial review.',
    email: 'readers@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
  {
    id: 'aut-source-desk',
    slug: 'source-desk',
    name: 'स्रोत डेस्क',
    role: 'wire',
    bioNe: 'बाह्य सार्वजनिक स्रोतका शीर्षक र मूल लिङ्कलाई स्पष्ट श्रेयसहित देखाउने डेस्क। यस पहिचानबाट मौलिक रिपोर्टिङ दाबी गरिँदैन।',
    bioEn:
      'The desk presenting externally sourced headlines and original links with explicit attribution. It never claims original reporting.',
    email: 'sources@nagarikwatch.com',
    verified: true,
    isActive: true,
  },
]

export const authorById = new Map(authors.map((author) => [author.id, author]))
export const authorBySlug = new Map(authors.map((author) => [author.slug, author]))
