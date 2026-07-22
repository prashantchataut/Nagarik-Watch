import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const dynamic = 'force-static'

export async function GET() {
  const locale: 'ne' | 'en' = 'ne'
  const items = await getDistributionStories(locale)
  const updated = items[0]?.publishedAt
    ? new Date(items[0].publishedAt).toISOString()
    : new Date(0).toISOString()
  const self = `${SITE_URL}/atom.xml`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${locale}">
  <id>${escapeXml(self)}</id>
  <title>Nagarik Watch</title>
  <updated>${updated}</updated>
  <link href="${escapeXml(self)}" rel="self" type="application/atom+xml" />
  <link href="${SITE_URL}/" />
  ${items
    .map((item) => {
      const story = distributionStory(item, locale)
      return `<entry>
    <id>${escapeXml(story.canonicalUrl)}</id>
    <title>${escapeXml(story.title)}</title>
    <link href="${escapeXml(story.canonicalUrl)}" rel="alternate" />
    <published>${story.publishedAt}</published>
    <updated>${story.publishedAt}</updated>
    <summary>${escapeXml(story.summary)}</summary>
  </entry>`
    })
    .join('\n')}
</feed>`

  return new Response(xml, { headers: { 'content-type': 'application/atom+xml; charset=utf-8' } })
}
