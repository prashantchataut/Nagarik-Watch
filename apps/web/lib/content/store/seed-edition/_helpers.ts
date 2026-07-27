import type { ArticleBlock } from '@nagarikwatch/db'
import type { StoredArticle } from '../json-store'
import { placeholder } from '../../seed/media'

export const EDITION_MEDIA_DIR = '/media/edition-2026-07'

/** Category-lead plates with compressed AI JPEGs in public/media. */
const RASTER_HERO_SLUGS = new Set([
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

export function heroUrl(slug: string, categorySlug: string, titleNe: string): string {
  if (RASTER_HERO_SLUGS.has(slug)) {
    return `${EDITION_MEDIA_DIR}/${slug}.jpg`
  }
  // Inline SVG so heroes never 404 if static media upload lags.
  return placeholder(slug, categorySlug, titleNe.slice(0, 42), titleNe, {
    credit: 'नागरिक वाच',
  }).url
}

/** Older seeds stored raster heroes as .png before JPEG compression. */
export function normalizeEditionHeroUrl(url: string | undefined, slug: string): string | undefined {
  if (!url || !url.includes(`${EDITION_MEDIA_DIR}/`)) return url
  if (!url.endsWith('.png')) return url
  if (RASTER_HERO_SLUGS.has(slug)) {
    return `${EDITION_MEDIA_DIR}/${slug}.jpg`
  }
  return url
}

export function p(text: string): ArticleBlock {
  return { type: 'paragraph', text }
}

export function h2(text: string): ArticleBlock {
  return { type: 'heading2', text }
}

export function h3(text: string): ArticleBlock {
  return { type: 'heading3', text }
}

export function quote(quoteNe: string, attribution?: string): ArticleBlock {
  return { type: 'pullQuote', quoteNe, attribution }
}

export function list(items: string[], ordered = false): ArticleBlock {
  return { type: 'list', ordered, items }
}

export function isoDaysAgo(days: number, hour = 8): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(hour, 15, 0, 0)
  return d.toISOString()
}

export function wordCount(blocks: ArticleBlock[]): number {
  return blocks
    .map((b) => {
      if ('text' in b && typeof b.text === 'string') return b.text
      if (b.type === 'pullQuote') return b.quoteNe
      if (b.type === 'list') return b.items.join(' ')
      return ''
    })
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

type BasePartial = Pick<
  StoredArticle,
  'id' | 'slug' | 'categorySlug' | 'titleNe' | 'bodyNe' | 'publishedAt' | 'updatedAt'
> &
  Partial<StoredArticle>

export function base(partial: BasePartial, createdBy = 'newsroom-edition-2026-07'): StoredArticle {
  const bodyNe = partial.bodyNe
  const words = wordCount(bodyNe)
  const slug = partial.slug
  const generatedHero = heroUrl(slug, partial.categorySlug, partial.titleNe)
  const heroImageUrl =
    partial.heroImageUrl?.startsWith('data:') || partial.heroImageUrl?.startsWith('http')
      ? partial.heroImageUrl
      : generatedHero
  return {
    authorIds: ['aut-newsroom-desk'],
    tagSlugs: [],
    isBreaking: false,
    isFeatured: 'none',
    workflowStage: 'published',
    sourceType: 'original',
    premium: false,
    commentsEnabled: true,
    locale: 'ne',
    noIndex: false,
    includeInNewsSitemap: true,
    heroImageAlt: partial.heroImageAlt ?? partial.titleNe,
    heroCaptionNe: partial.heroCaptionNe ?? partial.deckNe,
    heroCredit: 'नागरिक वाच',
    ...partial,
    heroImageUrl,
    hasEnglish: Boolean(partial.titleEn && partial.bodyEn?.length),
    readingMinutes: Math.max(2, Math.round(words / 200)),
    createdBy,
    updatedBy: createdBy,
  }
}
