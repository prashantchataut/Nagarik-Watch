import { getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const revalidate = 300

export async function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000
  const { items } = await getStories({ locale: 'ne', perPage: 100 })
  const fresh = items.filter((item) => Date.parse(item.publishedAt) >= cutoff)
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
