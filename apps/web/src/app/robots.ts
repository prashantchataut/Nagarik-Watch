import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nagarikwatch.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/editor', '/api/auth', '/api/bookmarks'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
