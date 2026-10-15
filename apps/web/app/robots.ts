export const dynamic = 'force-static'
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { isStaticPublicExport } from '@/lib/runtime/public-api'

/**
 * robots.txt. Allows all crawlers across the site and points them at the dynamic sitemap.
 * The sitemap URL must be absolute, so it's rooted at NEXT_PUBLIC_SITE_URL (falling back to
 * localhost for dev — robots.txt from localhost is harmless and never indexed).
 *
 * A static export is never the launch origin (ADR-004): it strips `app/api` and
 * `app/admin`, so auth, comments, bookmarks, polls, search and the newsroom do
 * not exist in that build. It may run as a preview or mirror, and a preview
 * must not be indexed — the alternative is Google holding a crippled copy of
 * the publication, and `cf-pages-build.mjs` pins the build origin to
 * `pages.dev`, so every canonical, OG tag and JSON-LD `@id` in that build
 * points somewhere that is not the publication. Disallowing the mirror is
 * strictly better than ranking it, and it is a no-op once the apex serves the
 * Node origin.
 */
export default function robots(): MetadataRoute.Robots {
  if (isStaticPublicExport) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: SITE_URL,
    }
  }

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
