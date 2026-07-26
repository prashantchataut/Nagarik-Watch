/**
 * Public-site runtime flags for static Cloudflare Pages vs full app host.
 * Baked at build time via NEXT_PUBLIC_STATIC_EXPORT=1 (cf-pages-build).
 */

export const isStaticPublicExport =
  process.env.NEXT_PUBLIC_STATIC_EXPORT === '1' || process.env.CF_PAGES_STATIC === '1'

/**
 * Live `/api/*` routes exist only on the full OpenNext/Vercel Worker host.
 * Static Pages has no API handlers; skip remote sync so the console stays clean
 * and device-local features (bookmarks) are not reverted on failed POSTs.
 */
export function hasLivePublicApi(): boolean {
  return !isStaticPublicExport
}
