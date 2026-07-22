import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'
import { isPastEmbargo, licenseTagFor, truncateForFeed } from '@/lib/syndication/partner-feed'

export const dynamic = 'force-static'

function embargoMinutes(): number {
  const raw = Number(process.env.PARTNER_FEED_EMBARGO_MINUTES ?? 0)
  return Number.isFinite(raw) && raw > 0 ? raw : 0
}

export async function GET() {
  const locale = 'ne'
  const items = await getDistributionStories(locale)
  const delayMinutes = embargoMinutes()

  const eligible = items.filter((item) =>
    isPastEmbargo({ embargoUntil: new Date(Date.parse(item.publishedAt) + delayMinutes * 60_000).toISOString() }),
  )

  return Response.json({
    version: '1.0',
    publisher: 'Nagarik Watch',
    locale,
    rights: 'Syndication requires a written partner agreement.',
    embargoMinutes: delayMinutes,
    requiredFields: ['canonicalUrl', 'attribution.publisher', 'attribution.url', 'license'],
    items: eligible.map((item) => {
      const story = distributionStory(item, locale)
      return {
        id: item.id,
        ...story,
        title: truncateForFeed(story.title, 110),
        summary: truncateForFeed(story.summary, 280),
        license: licenseTagFor({ partnerLimited: item.premium }),
        attribution: {
          publisher: 'Nagarik Watch',
          url: SITE_URL,
          requiredText: 'Originally published by Nagarik Watch',
        },
      }
    }),
  })
}