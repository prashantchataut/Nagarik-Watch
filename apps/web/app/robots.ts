export const dynamic = 'force-static'
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt. Allows all crawlers across the site and points them at the dynamic sitemap.
 * The sitemap URL must be absolute, so it's rooted at NEXT_PUBLIC_SITE_URL (falling back to
 * localhost for dev — robots.txt from localhost is harmless and never indexed).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/'],
      },
    ],
    // Three files, not one: /sitemap.xml is the site's structure, /news-sitemap.xml is the
    // 48-hour Google News window, and /archive-sitemap.xml is an index over the article
    // archive, which outgrows a single 50,000-URL file.
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/news-sitemap.xml`,
      `${SITE_URL}/archive-sitemap.xml`,
    ],
    host: SITE_URL,
  }
}
