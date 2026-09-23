import { categories } from '@/lib/content/seed/categories'
import { PROVINCES, STATIC_HUBS } from '@/lib/site'

/**
 * First path segments that are allowed under the public locale tree.
 *
 * Used by `proxy.ts` to emit a **real HTTP 404** for unknown top-level routes.
 * The proxy has to make this call itself: once a request is rewritten into the
 * locale tree it matches `[locale]/[category]`, and `notFound()` there renders
 * the recovery page with a `200` status, because Next commits the response
 * status as soon as a `loading.tsx` Suspense boundary streams (vercel/next.js
 * #93253 — maintainers confirm this is expected for streamed responses). The
 * only framework-level workaround is to remove the route skeleton, which
 * destabilises rendering modes, so the status decision belongs here.
 *
 * Adding a desk that is not in the canonical taxonomy:
 *   - set `NEXT_PUBLIC_EXTRA_PUBLIC_SEGMENTS=slug-a,slug-b` (build-time), or
 *   - set `NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS=1` to allow any slug-shaped
 *     first segment through to the App Router (the previous behaviour), and
 *     accept that unknown kebab-case URLs then answer `200` + `noindex`.
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
 * Opt-in escape hatch for a CMS-managed taxonomy: allow any slug-shaped first
 * segment through to the App Router instead of hard-404ing it.
 *
 * Off by default. With it off, an unknown top-level URL is a true 404 (what
 * crawlers and the reader-facing e2e suite expect). With it on, new desks work
 * without a redeploy, but unknown kebab-case URLs answer `200` + `noindex`
 * (Next's documented behaviour for streamed `notFound()`).
 */
function permissiveSegmentsEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_PERMISSIVE_PUBLIC_SEGMENTS?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

/** Latin kebab slugs that cannot collide with internal/system prefixes. */
function looksLikeCategorySlug(segment: string): boolean {
  if (segment.length < 2 || segment.length > 48) return false
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(segment)) return false
  if (segment.startsWith('api') || segment.startsWith('admin') || segment.startsWith('_')) {
    return false
  }
  return true
}

export function isAllowedPublicFirstSegment(segment: string): boolean {
  if (ALLOWED_FIRST_SEGMENTS.has(segment)) return true
  return permissiveSegmentsEnabled() && looksLikeCategorySlug(segment)
}

/** Exposed for the static audit that keeps this list in step with `app/[locale]`. */
export function allowedPublicFirstSegments(): string[] {
  return [...ALLOWED_FIRST_SEGMENTS].sort()
}
