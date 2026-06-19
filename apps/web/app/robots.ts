import type { MetadataRoute } from 'next'

/**
 * robots.txt. Allows all crawlers across the site and points them at the dynamic sitemap.
 * The sitemap URL must be absolute, so it's rooted at NEXT_PUBLIC_SITE_URL (falling back to
 * localhost for dev — robots.txt from localhost is harmless and never indexed).
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
