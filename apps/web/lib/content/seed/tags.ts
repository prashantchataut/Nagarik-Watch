import type { Tag } from '@nagarikwatch/db'

/** Seed tags / topics (content-model.md §4). Cross-category running-story groupings. */
export const tags: Tag[] = [
  {
    id: 'tag-budget',
    slug: 'budget-2083',
    nameNe: 'बजेट २०८३',
    nameEn: 'Budget 2083',
    descriptionNe: 'आर्थिक वर्ष २०८३/८४ को संघीय बजेटको कभरेज।',
    descriptionEn: 'Coverage of the federal budget for fiscal year 2083/84.',
  },
  {
    id: 'tag-election',
    slug: 'local-election',
    nameNe: 'स्थानीय निर्वाचन',
    nameEn: 'Local election',
    descriptionNe: 'स्थानीय तहको निर्वाचनसम्बन्धी समाचार र विश्लेषण।',
    descriptionEn: 'Reporting and analysis on local-level elections.',
  },
  {
    id: 'tag-cricket',
    slug: 'nepal-cricket',
    nameNe: 'नेपाली क्रिकेट',
    nameEn: 'Nepal cricket',
    descriptionNe: 'राष्ट्रिय क्रिकेट टोलीका समाचार।',
    descriptionEn: 'News on the national cricket team.',
  },
  {
    id: 'tag-climate',
    slug: 'climate',
    nameNe: 'जलवायु',
    nameEn: 'Climate',
    descriptionNe: 'वातावरण र जलवायु परिवर्तनका समाचार।',
    descriptionEn: 'Environment and climate coverage.',
  },
  {
    id: 'tag-migration',
    slug: 'labour-migration',
    nameNe: 'श्रम प्रवास',
    nameEn: 'Labour migration',
    descriptionNe: 'विदेशी रोजगारी र प्रवासी नेपालीका समाचार।',
    descriptionEn: 'Foreign employment and migrant-worker stories.',
  },
  {
    id: 'tag-football',
    slug: 'fifa-world-cup',
    nameNe: 'फिफा विश्वकप',
    nameEn: 'FIFA World Cup',
    descriptionNe: 'फिफा विश्वकप २०२६ को कभरेज।',
    descriptionEn: 'Coverage of the 2026 FIFA World Cup.',
  },
  {
    id: 'tag-geopolitics',
    slug: 'geopolitics',
    nameNe: 'भूराजनीति',
    nameEn: 'Geopolitics',
    descriptionNe: 'विश्व भूराजनीतिक विमर्श र संघर्षका समाचार।',
    descriptionEn: 'Global geopolitical conflict and analysis.',
  },
]

export const tagById = new Map(tags.map((t) => [t.id, t]))
export const tagBySlug = new Map(tags.map((t) => [t.slug, t]))
