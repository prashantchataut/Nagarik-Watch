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
  'preeti-unicode',
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
 * Locale codes are never content. `/en/ne` and `/en/en` are locale duplication,
 * and `en` has to stay in RESERVED for the top-level `/en` tree — so the pair is
 * rejected here, ahead of the allowlist, rather than by widening RESERVED.
 */
const NEVER_A_CATEGORY = new Set(['en', 'ne'])

/**
 * Opt-in escape hatch for a CMS-managed taxonomy: let any slug-shaped first
 * segment through to the App Router instead of hard-404ing it.
 *
 * Off by default, which is a behaviour change. It used to be unconditional, and
 * that quietly defeated the whole allowlist: almost every URL a crawler invents
 * is lowercase kebab, so the only paths that ever got a real 404 were ones with
 * a dot, an underscore or a capital. With it off, an unknown top-level URL is a
 * true 404. With it on, a desk added in the CMS works without a redeploy, at the
 * cost of unknown URLs answering 200 + `noindex` (see docs/LAUNCH-ROADMAP.md
 * §5.0 for why the status cannot be fixed downstream).
 *
 * Prefer `NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS` for a known new desk; this flag is
 * for the case where the taxonomy genuinely changes faster than deploys.
 */
function permissiveSegmentsEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

/** Latin kebab slugs that cannot collide with internal/system prefixes. */
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
  if (NEVER_A_CATEGORY.has(segment)) return false
  if (ALLOWED_FIRST_SEGMENTS.has(segment)) return true
  return permissiveSegmentsEnabled() && looksLikeCategorySlug(segment)
}

/** Exposed for the static audit that keeps this list in step with `app/[locale]`. */
export function allowedPublicFirstSegments(): string[] {
  return [...ALLOWED_FIRST_SEGMENTS].sort()
}
