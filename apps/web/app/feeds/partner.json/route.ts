import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'ne'
  const items = await getDistributionStories(locale)

  return Response.json({
    version: '1.0',
    publisher: 'Nagarik Watch',
    locale,
    rights: 'Syndication requires a written partner agreement.',
    requiredFields: ['canonicalUrl', 'attribution.publisher', 'attribution.url'],
    items: items.map((item) => {
      const story = distributionStory(item, locale)
      return {
        id: item.id,
        ...story,
        attribution: {
          publisher: 'Nagarik Watch',
          url: SITE_URL,
          requiredText: 'Originally published by Nagarik Watch',
        },
      }
    }),
  })
}
