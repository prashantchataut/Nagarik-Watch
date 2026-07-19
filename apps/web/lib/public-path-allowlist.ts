import { categories } from '@/lib/content/seed/categories'
import { PROVINCES, STATIC_HUBS } from '@/lib/site'

/**
 * First path segments that are allowed under the public locale tree.
 * Used by middleware to emit a real HTTP 404 for unknown top-level routes
 * (middleware rewrites otherwise turn App Router notFound() into soft 404s).
 */
const RESERVED = new Set([
  'about',
  'advertise',
  'auth',
  'author',
  'contact',
  'cookies',
  'corrections-policy',
  'district',
  'editorial-policy',
  'en',
  'epaper',
  'ethics',
  'fact-check-policy',
  'how-recommendations-work',
  'journalist',
  'live',
  'live-scores',
  'login',
  'nepse',
  'columns',
  'newsletter',
  'newsletter-confirmed',
  'opinion',
  'photos',
  'privacy',
  'profile',
  'province',
  'register',
  'rss',
  'saved',
  'search',
  'sitemap',
  'sports',
  'tag',
  'team',
  'terms',
  'topic',
  'wire',
])

const ALLOWED_FIRST_SEGMENTS = new Set<string>([
  ...RESERVED,
  ...categories.map((category) => category.slug),
  ...STATIC_HUBS.map((hub) => hub.path.replace(/^\//, '').split('/')[0]!).filter(Boolean),
  ...PROVINCES.map((province) => province.slug),
])

export function isAllowedPublicFirstSegment(segment: string): boolean {
  return ALLOWED_FIRST_SEGMENTS.has(segment)
}
