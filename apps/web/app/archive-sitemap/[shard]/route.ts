export const dynamic = 'force-static'
import { escapeXml } from '@/lib/xml'
import { collectArchiveUrls } from '@/lib/seo/archive-urls'
import { parseShardId, sitemapShardIds, sitemapShardSlice } from '@/lib/seo/sitemap-shards'

/**
 * One shard of the article archive sitemap, at `/archive-sitemap/<n>.xml`.
 *
 * Listed by `/archive-sitemap.xml`. A shard the archive does not have 404s
 * rather than returning an empty urlset, so a stale index entry is visible as
 * an error in Search Console instead of reading as "this part of the site has
 * no pages".
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const urls = await collectArchiveUrls()
  return sitemapShardIds(urls.length).map((shard) => ({ shard: `${shard}.xml` }))
}

export async function GET(_request: Request, { params }: { params: Promise<{ shard: string }> }) {
  const { shard: raw } = await params
  const match = /^(\d{1,3})\.xml$/.exec(raw)
  const shard = match ? parseShardId(match[1] ?? '') : null
  if (shard === null) return new Response('Not found', { status: 404 })

  const urls = await collectArchiveUrls()
  if (!sitemapShardIds(urls.length).includes(shard)) {
    return new Response('Not found', { status: 404 })
  }

  const slice = sitemapShardSlice(urls, shard)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${slice
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.priority.toFixed(2)}</priority>
${Object.entries(url.alternates)
  .map(
    ([language, href]) =>
      `    <xhtml:link rel="alternate" hreflang="${language}" href="${escapeXml(href)}" />`,
  )
  .join('\n')}
  </url>`,
  )
  .join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
