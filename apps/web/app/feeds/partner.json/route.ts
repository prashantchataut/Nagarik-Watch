import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'
import {
  checkPartnerTokenShape,
  isPastEmbargo,
  licenseTagFor,
  truncateForFeed,
} from '@/lib/syndication/partner-feed'

export const dynamic = 'force-dynamic'

function configuredPartnerTokens(): Set<string> {
  return new Set(
    (process.env.PARTNER_FEED_TOKENS ?? '')
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean),
  )
}

function embargoMinutes(): number {
  const raw = Number(process.env.PARTNER_FEED_EMBARGO_MINUTES ?? 0)
  return Number.isFinite(raw) && raw > 0 ? raw : 0
}

export async function GET(request: Request) {
  const tokens = configuredPartnerTokens()
  if (tokens.size > 0) {
    const token = new URL(request.url).searchParams.get('token')
    const shape = checkPartnerTokenShape(token)
    if (!shape.ok || !tokens.has(token ?? '')) {
      return Response.json({ error: 'A valid partner token is required.' }, { status: 401 })
    }
  }

  const locale = new URL(request.url).searchParams.get('locale') === 'en' ? 'en' : 'ne'
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
