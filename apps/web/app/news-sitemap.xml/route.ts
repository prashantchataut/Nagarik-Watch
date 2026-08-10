export const dynamic = 'force-static'
import { getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'
import { newsSitemapPriority } from '@/lib/algorithms/product/seo-dist'

export const revalidate = 300

export async function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const { items } = await getStories({ locale: 'ne', perPage: 100 })
  const fresh = items
    .filter(
      (item) =>
        item.noIndex !== true &&
        item.includeInNewsSitemap !== false &&
        Date.parse(item.publishedAt) >= cutoff,
    )
    .map((item) => ({
      item,
      priority: newsSitemapPriority(
        (Date.now() - Date.parse(item.publishedAt)) / 3_600_000,
        item.isBreaking,
        0.8,
      ),
    }))
    // Crawlers read news sitemaps top-down under a fixed budget, so the
    // freshest/breaking stories should appear first.
    .sort((a, b) => b.priority - a.priority)
    .map(({ item }) => item)
  const urls = fresh.flatMap((item) => [
    {
      loc: `${SITE_URL}/${item.category.slug}/${item.slug}`,
      language: 'ne',
      title: item.titleNe,
      publishedAt: item.publishedAt,
    },
    ...(item.hasEnglish && item.titleEn
      ? [
          {
            loc: `${SITE_URL}/en/${item.category.slug}/${item.slug}`,
            language: 'en',
            title: item.titleEn,
            publishedAt: item.publishedAt,
          },
        ]
      : []),
  ])
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Nagarik Watch</news:name>
        <news:language>${item.language}</news:language>
      </news:publication>
      <news:publication_date>${new Date(item.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escapeXml(item.title)}</news:title>
    </news:news>
  </url>`,
  )
  .join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
