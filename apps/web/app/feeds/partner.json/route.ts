import { NextResponse, type NextRequest } from 'next/server'
import { distributionStory, getDistributionStories } from '@/lib/feeds/stories'
import { SITE_URL } from '@/lib/site'
import {
  isPastEmbargo,
  licenseTagFor,
  presentedPartnerToken,
  truncateForFeed,
} from '@/lib/syndication/partner-feed'
import {
  authorizePartnerFeedToken,
  configuredPartnerFeedTokens,
} from '@/lib/syndication/partner-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function embargoMinutes(): number {
  const raw = Number(process.env.PARTNER_FEED_EMBARGO_MINUTES ?? 0)
  return Number.isFinite(raw) && raw > 0 ? raw : 0
}

function closed(status: number, error: string) {
  return NextResponse.json(
    { error },
    { status, headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}

export async function GET(request: NextRequest) {
  const tokens = configuredPartnerFeedTokens()
  if (tokens.length === 0) {
    return closed(503, 'Partner feed is not configured.')
  }

  const presented = presentedPartnerToken(
    request.headers.get('authorization'),
    request.nextUrl.searchParams.get('token'),
  )
  if (!authorizePartnerFeedToken(presented, tokens)) {
    return closed(401, 'Unauthorized.')
  }

  const locale = 'ne'
  const items = await getDistributionStories(locale)
  const delayMinutes = embargoMinutes()

  const eligible = items.filter((item) =>
    isPastEmbargo({
      embargoUntil: new Date(Date.parse(item.publishedAt) + delayMinutes * 60_000).toISOString(),
    }),
  )

  return NextResponse.json(
    {
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
    },
    { headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}
