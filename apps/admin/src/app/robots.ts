import type { MetadataRoute } from 'next'

/**
 * The CMS host is staff-only. Nothing here is a public document: crawlers get an
 * explicit site-wide refusal rather than relying on the `X-Robots-Tag` header
 * alone (belt and braces, and it also covers non-HTML assets).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  }
}
