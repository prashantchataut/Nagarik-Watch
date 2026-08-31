import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/news/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/editor', '/api/auth', '/api/bookmarks', '/api/launch-check', '/api/ads/campaigns', '/journalist', '/profile'],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  }
}
