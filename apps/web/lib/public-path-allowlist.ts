import { categories } from '@/lib/content/seed/categories'
import { PROVINCES, STATIC_HUBS } from '@/lib/site'

/**
 * First path segments that are allowed under the public locale tree.
 * Used by middleware to emit a real HTTP 404 for unknown top-level routes
 * (middleware rewrites otherwise turn App Router notFound() into soft 404s).
 *
 * Operator-added category slugs (beyond seed) can be appended via
 * NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS=comma,separated,slugs so middleware
 * does not hard-404 new desk taxonomy before a redeploy of seed lists.
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
  'help',
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
  'patro',
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

function extraPublicSegments(): string[] {
  const raw = process.env.NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS?.trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter((part) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part) && part.length <= 64)
}

const ALLOWED_FIRST_SEGMENTS = new Set<string>([
  ...RESERVED,
  ...categories.map((category) => category.slug),
  ...STATIC_HUBS.map((hub) => hub.path.replace(/^\//, '').split('/')[0]!).filter(Boolean),
  ...PROVINCES.map((province) => province.slug),
  ...extraPublicSegments(),
])

/**
 * Safe slug-shaped segments (latin kebab) are allowed so newly created category
 * routes are not hard-404'd before seed/env catch up. App Router still 404s
 * unknown pages; this only prevents middleware from inventing a soft 404 rewrite
 * for legitimate category URLs.
 */
function looksLikeCategorySlug(segment: string): boolean {
  if (segment.length < 2 || segment.length > 48) return false
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(segment)) return false
  // Block accidental collision with internal/system first segments.
  if (segment.startsWith('api') || segment.startsWith('admin') || segment.startsWith('_')) {
    return false
  }
  return true
}

export function isAllowedPublicFirstSegment(segment: string): boolean {
  if (ALLOWED_FIRST_SEGMENTS.has(segment)) return true
  return looksLikeCategorySlug(segment)
}
