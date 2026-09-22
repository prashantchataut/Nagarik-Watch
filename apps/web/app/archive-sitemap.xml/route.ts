export const dynamic = 'force-static'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'
import { collectArchiveUrls } from '@/lib/seo/archive-urls'
import { sitemapShardIds } from '@/lib/seo/sitemap-shards'

/**
 * Sitemap index for the article archive.
 *
 * `/sitemap.xml` carries the site's structural URLs — hubs, categories,
 * authors, topics, galleries. The archive is here because it is the part that
 * grows without bound, and a single file stops being valid at 50,000 URLs. The
 * index names one shard file per 20,000 URLs; robots.txt points at this index,
 * so adding a shard needs no change anywhere else.
 */
export const revalidate = 3600

export async function GET() {
  const urls = await collectArchiveUrls()
  const lastModified = urls[0]?.lastModified ?? new Date().toISOString()
  const shards = sitemapShardIds(urls.length)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${shards
  .map(
    (shard) => `  <sitemap>
    <loc>${escapeXml(`${SITE_URL}/archive-sitemap/${shard}.xml`)}</loc>
    <lastmod>${lastModified}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
