/**
 * Shared SEO / distribution checks: canonical URLs, hreflang coverage,
 * Open Graph previews, RSS item completeness, FAQ schema density.
 */

export function canonicalOk(url: string, canonical: string): boolean {
  if (!url || !canonical) return false
  return url.replace(/\/+$/, '') === canonical.replace(/\/+$/, '')
}

export function hreflangCoverage(locales: string[], provided: string[]): number {
  if (locales.length === 0) return 1
  const have = new Set(provided)
  const covered = locales.filter((l) => have.has(l)).length
  return covered / locales.length
}

export function ogPreviewScore(fields: { title?: string; image?: string; description?: string }): number {
  let score = 0
  if (fields.title && fields.title.length > 0) score += 0.34
  if (fields.image && /^https?:\/\//.test(fields.image)) score += 0.33
  if (fields.description && fields.description.length >= 40) score += 0.33
  return Math.min(1, score)
}

export function rssItemHealth(item: { title?: string; link?: string; pubDate?: string; guid?: string }): number {
  const fields = [item.title, item.link, item.pubDate, item.guid]
  const present = fields.filter((f) => Boolean(f)).length
  return present / fields.length
}

export function faqSchemaScore(qaPairs: number): number {
  if (qaPairs <= 0) return 0
  return Math.max(0, Math.min(1, qaPairs / 5))
}

export function internalLinkAuthority(inboundLinks: number, outboundLinks: number): number {
  const total = inboundLinks + outboundLinks
  if (total === 0) return 0
  return Math.max(0, Math.min(1, inboundLinks / total))
}

export function crawlBudgetScore(freshUrls: number, staleUrls: number, crawlRateLimit: number): number {
  const demand = freshUrls + staleUrls * 0.2
  if (crawlRateLimit <= 0) return 0
  return Math.max(0, Math.min(1, crawlRateLimit / Math.max(1, demand)))
}

/**
 * News-sitemap / homepage-priority weighting: newer and breaking stories get
 * a higher crawl priority, with category weight as a smaller tie-breaker.
 * Used both for the news sitemap ordering and the standard sitemap's
 * per-article `priority` field.
 */
export function newsSitemapPriority(
  ageHours: number,
  isBreaking: boolean,
  categoryWeight = 0.8,
): number {
  const freshness = 1 - Math.min(1, Math.max(0, ageHours) / 48)
  const weight = Math.max(0, Math.min(1, categoryWeight))
  return Math.max(0, Math.min(1, freshness * 0.5 + (isBreaking ? 0.3 : 0) + weight * 0.2))
}

/**
 * Open Graph / news-card image dimension check. Google/Facebook/Twitter all
 * expect at least 1200x630 for large-image cards; smaller images degrade to
 * a partial score instead of a hard fail so callers can still rank options.
 */
export function ogImageDimensionScore(width: number, height: number): number {
  if (width >= 1200 && height >= 630) return 1
  if (width <= 0 || height <= 0) return 0
  return Math.max(0, Math.min(1, (width / 1200) * (height / 630)))
}

export function ogImageDimensionOk(width: number, height: number): boolean {
  return width >= 1200 && height >= 630
}
