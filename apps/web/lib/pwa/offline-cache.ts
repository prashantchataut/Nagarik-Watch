/**
 * Pure helpers for the public offline service worker.
 * Kept free of browser Cache APIs so Vitest can cover eligibility rules.
 */

/** Bump on SW strategy changes so activate clears stale HTML shells. */
export const OFFLINE_CACHE_VERSION = 'v5'

export const SHELL_CACHE_NAME = `nagarik-watch-shell-${OFFLINE_CACHE_VERSION}`
export const ARTICLE_CACHE_NAME = `nagarik-watch-articles-${OFFLINE_CACHE_VERSION}`
export const IMAGE_CACHE_NAME = `nagarik-watch-images-${OFFLINE_CACHE_VERSION}`

export const ARTICLE_CACHE_LIMIT = 30
export const IMAGE_CACHE_LIMIT = 80

/**
 * Precache only durable shell assets. Never precache HTML: Next.js hashed
 * `/_next/static` chunks rotate every deploy; a stale document shell causes
 * MIME/ChunkLoadError against Vercel's text/plain not-found.txt.
 */
export const SHELL_PRECACHE_URLS = [
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-icon.png',
] as const

/** Icons/manifest may use cache-first; HTML must not. */
export const SHELL_ASSET_URLS = ['/manifest.webmanifest', '/icon.svg', '/apple-icon.png'] as const

export const CURRENT_OFFLINE_CACHE_NAMES = [
  SHELL_CACHE_NAME,
  ARTICLE_CACHE_NAME,
  IMAGE_CACHE_NAME,
] as const

/** First path segments that are never treated as article category slugs. */
export const NON_ARTICLE_FIRST_SEGMENTS = [
  '_next',
  'about',
  'admin',
  'advertise',
  'api',
  'apple-icon.png',
  'archive',
  'auth',
  'author',
  'contact',
  'cookies',
  'corrections-policy',
  'data-stories',
  'disaster-alerts',
  'district',
  'editor-picks',
  'editorial-policy',
  'election',
  'en',
  'ethics',
  'exclusive',
  'fact-check',
  'fact-check-policy',
  'favicon.ico',
  'favicon.png',
  'how-recommendations-work',
  'icon.png',
  'icon.svg',
  'journalist',
  'latest',
  'live',
  'live-scores',
  'llms-full.txt',
  'llms.txt',
  'login',
  'manifest.webmanifest',
  'market',
  'membership',
  'most-read',
  'ne',
  'nepse',
  'newsletter-confirmed',
  'opengraph-image.png',
  'patro',
  'photos',
  'preeti-unicode',
  'privacy',
  'profile',
  'province',
  'rashifal',
  'reader-corner',
  'register',
  'results',
  'robots.txt',
  'rss',
  'rss.xml',
  'saved',
  'search',
  'sellers.json',
  'sitemap',
  'sitemap.xml',
  'submit-story',
  'sw.js',
  'tag',
  'team',
  'terms',
  'topic',
  'trending',
  'utilities',
  'video',
  'wire',
] as const

/** Known two-segment public paths that are hubs, not articles. */
export const NON_ARTICLE_TWO_SEGMENT_PATHS = ['/sports/live'] as const

/**
 * Strip the public English locale prefix so path policy can be locale-agnostic.
 * Nepali stays at the site root (no `/ne` in public URLs).
 */
export function stripPublicLocalePrefix(pathname: string): string {
  if (pathname === '/en') return '/'
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/'
  return pathname
}

/**
 * Account, newsroom, API, and personalized desks must never enter offline caches.
 */
export function isOfflineExcludedPath(pathname: string): boolean {
  if (!pathname) return true
  if (pathname === '/api' || pathname.startsWith('/api/')) return true
  if (/^\/(admin|journalist|auth)(\/|$)/.test(pathname)) return true

  const path = stripPublicLocalePrefix(pathname)
  if (/^\/(admin|journalist|auth|api)(\/|$)/.test(path)) return true
  if (/^\/(saved|profile|reader-corner)(\/|$)/.test(path)) return true
  return false
}

/**
 * Same-origin public article HTML: `/{category}/{slug}` or `/en/{category}/{slug}`.
 */
export function isPublicArticlePath(
  pathname: string,
  nonArticleFirstSegments: readonly string[],
  nonArticleTwoSegmentPaths: readonly string[],
): boolean {
  if (isOfflineExcludedPath(pathname)) return false

  const path = stripPublicLocalePrefix(pathname)
  const normalized = path.replace(/\/$/, '') || '/'
  if (nonArticleTwoSegmentPaths.indexOf(normalized) !== -1) return false

  const match = /^\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i.exec(path)
  if (!match) return false

  const category = match[1]?.toLowerCase()
  if (!category) return false
  if (nonArticleFirstSegments.indexOf(category) !== -1) return false
  return true
}

/** Convenience wrapper for app/tests using the canonical reserved-segment lists. */
export function isPublicArticleNavigationPath(pathname: string): boolean {
  return isPublicArticlePath(pathname, NON_ARTICLE_FIRST_SEGMENTS, NON_ARTICLE_TWO_SEGMENT_PATHS)
}

/**
 * Reject Cache-Control values that mark the response as private or non-storeable.
 * Missing / empty headers are allowed; callers still require ok + same-origin.
 */
export function isCacheControlAllowed(cacheControl: string | null | undefined): boolean {
  if (!cacheControl || !cacheControl.trim()) return true

  const directives = cacheControl
    .toLowerCase()
    .split(',')
    .map((part) => part.trim().split('=', 1)[0]?.trim())
    .filter(Boolean)

  return directives.indexOf('private') === -1 && directives.indexOf('no-store') === -1
}

export type OfflineResponseLike = {
  ok: boolean
  status: number
  type: string
  cacheControl?: string | null
}

/**
 * Safe to put into the offline article/image caches.
 * Blocks non-OK, opaque/cross-origin, and private/no-store responses.
 */
export function isOfflineCacheableResponse(response: OfflineResponseLike): boolean {
  if (!response.ok || response.status === 0) return false
  if (
    response.type === 'opaque' ||
    response.type === 'opaqueredirect' ||
    response.type === 'error'
  ) {
    return false
  }
  return isCacheControlAllowed(response.cacheControl)
}

/**
 * Deterministic eviction: drop the oldest keys (front of the list) until `limit`.
 * `existingKeys` should be oldest → newest (Cache Storage insertion order).
 */
export function selectKeysToDelete(existingKeys: readonly string[], limit: number): string[] {
  if (limit < 0) return existingKeys.slice()
  if (existingKeys.length <= limit) return []
  return existingKeys.slice(0, existingKeys.length - limit)
}

export function isSameOriginUrl(requestUrl: string, origin: string): boolean {
  try {
    // Absolute URL only — relative values must not inherit the page origin here.
    return new URL(requestUrl).origin === new URL(origin).origin
  } catch {
    return false
  }
}

/**
 * Embeddable helper source for `/sw.js`. Mirrors the TypeScript helpers above
 * so the worker never depends on bundler `.toString()` renaming.
 */
export function buildOfflineWorkerHelpersSource(): string {
  return `
const NON_ARTICLE_FIRST_SEGMENTS = ${JSON.stringify([...NON_ARTICLE_FIRST_SEGMENTS])}
const NON_ARTICLE_TWO_SEGMENT_PATHS = ${JSON.stringify([...NON_ARTICLE_TWO_SEGMENT_PATHS])}

function stripPublicLocalePrefix(pathname) {
  if (pathname === '/en') return '/'
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/'
  return pathname
}

function isOfflineExcludedPath(pathname) {
  if (!pathname) return true
  if (pathname === '/api' || pathname.startsWith('/api/')) return true
  if (/^\\/(admin|journalist|auth)(\\/|$)/.test(pathname)) return true

  const path = stripPublicLocalePrefix(pathname)
  if (/^\\/(admin|journalist|auth|api)(\\/|$)/.test(path)) return true
  if (/^\\/(saved|profile|reader-corner)(\\/|$)/.test(path)) return true
  return false
}

function isPublicArticlePath(pathname, nonArticleFirstSegments, nonArticleTwoSegmentPaths) {
  if (isOfflineExcludedPath(pathname)) return false

  const path = stripPublicLocalePrefix(pathname)
  const normalized = path.replace(/\\/$/, '') || '/'
  if (nonArticleTwoSegmentPaths.indexOf(normalized) !== -1) return false

  const match = /^\\/([a-z0-9-]+)\\/([a-z0-9-]+)\\/?$/i.exec(path)
  if (!match) return false

  const category = match[1] && match[1].toLowerCase()
  if (!category) return false
  if (nonArticleFirstSegments.indexOf(category) !== -1) return false
  return true
}

function isPublicArticleNavigationPath(pathname) {
  return isPublicArticlePath(pathname, NON_ARTICLE_FIRST_SEGMENTS, NON_ARTICLE_TWO_SEGMENT_PATHS)
}

function isCacheControlAllowed(cacheControl) {
  if (!cacheControl || !String(cacheControl).trim()) return true

  const directives = String(cacheControl)
    .toLowerCase()
    .split(',')
    .map(function (part) {
      return part.trim().split('=')[0].trim()
    })
    .filter(Boolean)

  return directives.indexOf('private') === -1 && directives.indexOf('no-store') === -1
}

function isOfflineCacheableResponse(response) {
  if (!response.ok || response.status === 0) return false
  if (response.type === 'opaque' || response.type === 'opaqueredirect' || response.type === 'error') {
    return false
  }
  return isCacheControlAllowed(response.cacheControl)
}

function selectKeysToDelete(existingKeys, limit) {
  if (limit < 0) return existingKeys.slice()
  if (existingKeys.length <= limit) return []
  return existingKeys.slice(0, existingKeys.length - limit)
}
`.trim()
}
