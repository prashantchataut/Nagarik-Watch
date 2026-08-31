import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nagarikwatch.com'

/** Sitemap — the portal is a hash-routed single page, so the crawlers' entry
 *  points are the site itself plus the machine feeds. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE}/api/rss`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
  ]
}
