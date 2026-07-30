import { NextResponse, type NextRequest } from 'next/server'
import { getStories } from '@/lib/content'
import { getEmailProviderState } from '@/lib/email-provider'
import { createNewsletterIssue, processNewsletterQueue } from '@/lib/newsletter-admin'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { digestScore, rankDigestStories } from '@/lib/reader/digest'
import { buildStoryEngagementIndex, signalsForStory } from '@/lib/ranking-signals'
import { SITE_URL } from '@/lib/site'

const JOB = 'digest-compose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Morning brief: rank live stories (digest + engagement), save a newsletter
 * *draft* for desk review. Only sends when DIGEST_SEND_NOW=true and email is ready.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  await recordCronHeartbeat(JOB).catch(() => undefined)

  const [{ items }, engagement] = await Promise.all([
    getStories({ locale: 'ne', perPage: 48 }),
    buildStoryEngagementIndex(24 * 60).catch(() => null),
  ])

  const affinityBoosted = [...items].sort((a, b) => {
    if (!engagement) return 0
    const sa = signalsForStory(a, engagement)
    const sb = signalsForStory(b, engagement)
    return (sb.viewsPerHour ?? 0) + (sb.dwellTimeSeconds ?? 0) / 60 -
      ((sa.viewsPerHour ?? 0) + (sa.dwellTimeSeconds ?? 0) / 60)
  })

  const pool = affinityBoosted.length > 0 ? affinityBoosted : items
  const ranked = rankDigestStories(pool, null, { limit: 12 })
  const top = ranked.slice(0, 5).map((story) => {
    const scored = digestScore(story, null)
    const live = engagement ? signalsForStory(story, engagement) : null
    return {
      id: story.id,
      slug: story.slug,
      score: Number(scored.score.toFixed(4)),
      civic: Number(scored.civic.toFixed(3)),
      novelty: Number(scored.novelty.toFixed(3)),
      dwell: live ? Math.round(live.dwellTimeSeconds ?? 0) : 0,
      viewsPerHour: live ? Number((live.viewsPerHour ?? 0).toFixed(2)) : 0,
    }
  })

  if (ranked.length === 0) {
    return NextResponse.json({
      ok: true,
      job: JOB,
      candidates: 0,
      empty: true,
      sent: 0,
      draft: false,
      reason: 'empty-corpus',
      top: [],
    })
  }

  const dateLabel = new Date().toISOString().slice(0, 10)
  const lines = ranked.slice(0, 8).map((story, index) => {
    const title = story.titleNe
    const href = `${SITE_URL}/${story.category.slug}/${story.slug}`
    const deck = story.deckNe ? `\n   ${story.deckNe}` : ''
    return `${index + 1}. ${title}${deck}\n   ${href}`
  })
  const subject = `नागरिक वाच बिहानी सार · ${dateLabel}`
  const body = [
    'बिहानी सार — नागरिक वाच (desk draft)',
    '',
    'यो स्वचालित ड्राफ्ट हो। पठाउनुअघि सम्पादकले समीक्षा गर्नुहोस्।',
    '',
    ...lines,
    '',
    `Archive: ${SITE_URL}/newsletter/archive`,
    `Admin: ${SITE_URL}/admin/newsletter`,
  ].join('\n')

  const sendNow = process.env.DIGEST_SEND_NOW?.trim().toLowerCase() === 'true'
  const email = getEmailProviderState()

  const issue = await createNewsletterIssue({
    subject,
    body,
    sendNow: sendNow && email.ready,
  })

  let delivery = { delivered: 0, failed: 0, detail: 'draft-only' as string | undefined }
  if (sendNow && email.ready && issue.status === 'queued') {
    delivery = await processNewsletterQueue(1)
  }

  return NextResponse.json({
    ok: true,
    job: JOB,
    candidates: ranked.length,
    empty: false,
    draft: issue.status === 'draft',
    issueId: issue.id,
    sent: delivery.delivered,
    failed: delivery.failed,
    reason: sendNow
      ? email.ready
        ? delivery.delivered > 0
          ? 'delivered'
          : 'queued-or-failed'
        : 'email-adapter-disabled'
      : 'draft-saved-for-review',
    detail: sendNow ? delivery.detail ?? email.detail : 'Set DIGEST_SEND_NOW=true to auto-send after draft.',
    top,
  })
}

export const GET = run
export const POST = run
