const LEGACY_EDITION_MEDIA_DIR = '/media/edition-2026-07'

const LEGACY_JPEG_SLUGS = new Set([
  'provincial-alliance-realignment-2083',
  'monsoon-highway-community-impact',
  'wholesale-inflation-fuel-cost-pressure',
  'west-asia-energy-shock-nepal-lens',
  'new-nepali-poetry-collections',
  'digital-id-public-services',
  'monsoon-disease-alert-guide',
  'see-grade12-result-culture',
  'interview-provincial-planner',
  'photo-monsoon-markets',
  'video-desk-how-we-work',
  'gulf-labour-rights-briefing',
  'national-cricket-training-camp-focus',
  'nepali-film-festival-prep',
  'federalism-accountability-column',
])

export function normalizeLegacyHeroUrl(url: string | undefined, slug: string): string | undefined {
  if (!url || !url.includes(`${LEGACY_EDITION_MEDIA_DIR}/`) || !url.endsWith('.png')) return url
  return LEGACY_JPEG_SLUGS.has(slug) ? `${LEGACY_EDITION_MEDIA_DIR}/${slug}.jpg` : url
}
