import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { PUBLICATION, SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'
export const revalidate = 600

export async function GET() {
  const items = await getDistributionStories('ne', 30)
  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: PUBLICATION.publisherName,
    home_page_url: `${SITE_URL}/`,
    feed_url: `${SITE_URL}/feed.json`,
    language: 'ne',
    description: 'Devanagari-first digital news from Nepal.',
    items: items.map((item) => {
      const story = distributionStory(item, 'ne')
      return {
        id: story.canonicalUrl,
        url: story.canonicalUrl,
        title: story.title,
        summary: story.summary,
        date_published: story.publishedAt,
        authors: item.authors.map((author) => ({
          name: author.name,
          url: `${SITE_URL}/author/${author.slug}`,
        })),
        tags: item.tags?.map((tag) => tag.nameNe || tag.slug) ?? [],
        image: item.heroImage?.url?.startsWith('http') ? item.heroImage.url : undefined,
      }
    }),
  }
  return Response.json(feed, {
    headers: { 'content-type': 'application/feed+json; charset=utf-8' },
  })
}
