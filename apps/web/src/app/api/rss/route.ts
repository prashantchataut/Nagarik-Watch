import { db } from '@/lib/db'
import { stories } from '@/lib/news/data'

export const dynamic = 'force-dynamic'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * RSS 2.0 feed — latest 30 published items across the static archive
 * and CMS articles. (In the repo's multi-page deployment each item links to
 * its real article URL; in this preview build the hash router serves them.)
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const origin = `${url.protocol}//${url.host}`

  const dbArticles = await db.article.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: 30,
    include: { author: { select: { name: true } } },
  })

  const items = [
    ...stories.map((s) => ({
      title: s.titleNe,
      description: s.deckNe,
      desk: s.desk,
      slug: s.slug,
      author: s.author,
      date: s.publishedAt,
    })),
    ...dbArticles.map((a) => ({
      title: a.titleNe,
      description: a.deckNe,
      desk: a.desk,
      slug: a.slug,
      author: a.author.name,
      date: (a.publishedAt ?? a.createdAt).toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>नागरिक वाच — Nagarik Watch</title>
<link>${escapeXml(origin)}</link>
<description>नेपालका लागि स्वतन्त्र, तथ्यमा आधारित पत्रकारिता — राजनीति, समाज, बजार, खेलकुद, विचार र सातै प्रदेशका समाचार।</description>
<language>ne-NP</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items
  .map(
    (it) => `<item>
<title>${escapeXml(it.title)}</title>
<link>${escapeXml(`${origin}/#/${it.desk}/${it.slug}`)}</link>
<guid isPermaLink="false">nagarik-watch:${it.desk}/${it.slug}</guid>
<description>${escapeXml(it.description)}</description>
<dc:creator>${escapeXml(it.author)}</dc:creator>
<pubDate>${new Date(it.date).toUTCString()}</pubDate>
<category>${escapeXml(it.desk)}</category>
</item>`,
  )
  .join('\n')}
</channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  })
}
