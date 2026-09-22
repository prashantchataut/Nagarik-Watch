/**
 * Splitting the article archive across sitemap files.
 *
 * `app/sitemap.ts` used to read `perPage: 1000` and emit whatever came back.
 * That is fine for a newsroom with 400 stories and silently wrong for one with
 * 1,400: story 1,001 onwards simply stops being advertised, and nothing fails —
 * the sitemap still validates, the site still builds, the archive just quietly
 * leaves the index. This module is the fix, and the cap is the protocol's, not
 * a guess.
 *
 * The sitemaps.org limit is 50,000 URLs (and 50 MB uncompressed) per file. We
 * shard below it rather than at it: each story can contribute two URLs (ne and
 * en) plus alternates markup, so a shard sized at the limit in stories would
 * blow through it in URLs.
 */

/** URLs per shard. Under the 50,000 protocol limit, with room for alternates. */
export const SITEMAP_URLS_PER_SHARD = 20_000

/**
 * Hard ceiling on shards, so a corrupt total can never ask the build to
 * prerender an unbounded number of routes. 50 shards is a million URLs; a
 * newsroom that outgrows it has earned a different conversation.
 */
export const MAX_SITEMAP_SHARDS = 50

/** How many shard files an archive of `urlCount` URLs needs. Always at least 1. */
export function sitemapShardCount(urlCount: number): number {
  if (!Number.isFinite(urlCount) || urlCount <= 0) return 1
  return Math.min(MAX_SITEMAP_SHARDS, Math.max(1, Math.ceil(urlCount / SITEMAP_URLS_PER_SHARD)))
}

/** Shard ids, for `generateStaticParams` and for the sitemap index. */
export function sitemapShardIds(urlCount: number): number[] {
  return Array.from({ length: sitemapShardCount(urlCount) }, (_, index) => index)
}

/**
 * The slice of `items` belonging to shard `shard`.
 *
 * Out-of-range shards return nothing rather than throwing: the route that asks
 * for shard 9 of a 3-shard archive should 404, and that decision belongs to the
 * route, not here.
 */
export function sitemapShardSlice<T>(items: readonly T[], shard: number): T[] {
  if (!Number.isInteger(shard) || shard < 0 || shard >= MAX_SITEMAP_SHARDS) return []
  const start = shard * SITEMAP_URLS_PER_SHARD
  return items.slice(start, start + SITEMAP_URLS_PER_SHARD)
}

/** Parse a shard id out of a route param. Anything else is not a shard. */
export function parseShardId(raw: string): number | null {
  if (!/^\d{1,3}$/.test(raw)) return null
  const value = Number(raw)
  return value < MAX_SITEMAP_SHARDS ? value : null
}
