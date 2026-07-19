import { ogImageDimensionOk } from '@/lib/algorithms/product/seo-dist'

/**
 * Social crawlers cannot use data: URLs. Prefer absolute https images; otherwise
 * fall back to the site OG asset so share cards never emit unusable heroes.
 * When `dims` is supplied and the hero is smaller than the 1200x630 minimum
 * that Facebook/Twitter/Google expect, fall back to the site OG asset too.
 */
export function publicShareImageUrl(
  candidate: string | null | undefined,
  siteUrl: string,
  dims?: { width?: number; height?: number },
): string {
  const fallback = `${siteUrl.replace(/\/$/, '')}/opengraph-image.png`
  if (!candidate?.trim()) return fallback
  const value = candidate.trim()
  if (value.startsWith('data:')) return fallback
  if (dims?.width && dims?.height && !ogImageDimensionOk(dims.width, dims.height)) return fallback
  if (value.startsWith('https://') || value.startsWith('http://')) return value
  if (value.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${value}`
  return fallback
}
