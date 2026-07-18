import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const dynamic = 'force-static'

export async function GET() {
  const items = await getDistributionStories('ne')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>नागरिक वाच</title>
    <link>${SITE_URL}/</link>
    <description>नेपालका लागि देवनागरी-पहिलो डिजिटल समाचार पोर्टल।</description>
    <language>ne-NP</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items
      .map((item) => {
        const story = distributionStory(item, 'ne')
        return `<item>
      <title>${escapeXml(story.title)}</title>
      <link>${escapeXml(story.canonicalUrl)}</link>
      <guid isPermaLink="true">${escapeXml(story.canonicalUrl)}</guid>
      <pubDate>${new Date(story.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(story.summary)}</description>
    </item>`
      })
      .join('\n')}
  </channel>
</rss>`
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } })
}
