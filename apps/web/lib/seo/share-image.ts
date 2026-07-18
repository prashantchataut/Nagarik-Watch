/**
 * Social crawlers cannot use data: URLs. Prefer absolute https images; otherwise
 * fall back to the site OG asset so share cards never emit unusable heroes.
 */
export function publicShareImageUrl(
  candidate: string | null | undefined,
  siteUrl: string,
): string {
  const fallback = `${siteUrl.replace(/\/$/, '')}/opengraph-image.png`
  if (!candidate?.trim()) return fallback
  const value = candidate.trim()
  if (value.startsWith('data:')) return fallback
  if (value.startsWith('https://') || value.startsWith('http://')) return value
  if (value.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${value}`
  return fallback
}
