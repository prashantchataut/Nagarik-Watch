import { getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const dynamic = 'force-static'

export async function GET() {
  const { items } = await getStories({ locale: 'ne', perPage: 50 })
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>नागरिक वाच</title>
    <link>${SITE_URL}/</link>
    <description>नेपालको नागरिककेन्द्रित, स्वतन्त्र र विश्वसनीय समाचार पोर्टल।</description>
    <language>ne-NP</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (item) => `<item>
      <title>${escapeXml(item.titleNe)}</title>
      <link>${escapeXml(`${SITE_URL}/${item.category.slug}/${item.slug}`)}</link>
      <guid isPermaLink="true">${escapeXml(`${SITE_URL}/${item.category.slug}/${item.slug}`)}</guid>
      <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(item.deckNe ?? item.titleNe)}</description>
    </item>`,
      )
      .join('\n')}
  </channel>
</rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
