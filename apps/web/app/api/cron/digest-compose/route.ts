import { NextResponse, type NextRequest } from 'next/server'
import { getStories } from '@/lib/content'
import { getEmailProviderState } from '@/lib/email-provider'
import {
  createNewsletterIssue,
  processNewsletterQueue,
} from '@/lib/newsletter-admin'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { digestScore, rankDigestStories } from '@/lib/reader/digest'
import { SITE_URL } from '@/lib/site'

const JOB = 'digest-compose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Composes a morning-digest candidate list from live published stories,
 * queues a newsletter issue when the email adapter is ready, and attempts
 * delivery. Honest empty / disabled states — never fabricates articles.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  await recordCronHeartbeat(JOB).catch(() => undefined)

  const { items } = await getStories({ locale: 'ne', perPage: 48 })
  const ranked = rankDigestStories(items, null, { limit: 12 })
  const top = ranked.slice(0, 5).map((story) => {
    const scored = digestScore(story, null)
    return {
      id: story.id,
      slug: story.slug,
      score: Number(scored.score.toFixed(4)),
      civic: Number(scored.civic.toFixed(3)),
      novelty: Number(scored.novelty.toFixed(3)),
    }
  })

  if (ranked.length === 0) {
    return NextResponse.json({
      ok: true,
      job: JOB,
      candidates: 0,
      empty: true,
      sent: 0,
      reason: 'empty-corpus',
      top: [],
    })
  }

  const email = getEmailProviderState()
  if (!email.ready) {
    return NextResponse.json({
      ok: true,
      job: JOB,
      candidates: ranked.length,
      empty: false,
      sent: 0,
      reason: 'email-adapter-disabled',
      detail: email.detail,
      top,
    })
  }

  const lines = ranked.slice(0, 8).map((story, index) => {
    const title = story.titleNe
    const href = `${SITE_URL}/${story.category.slug}/${story.slug}`
    return `${index + 1}. ${title}\n${href}`
  })
  const subject = `Nagarik Watch digest · ${new Date().toISOString().slice(0, 10)}`
  const body = [
    'Today\'s civic digest from Nagarik Watch.',
    '',
    ...lines,
    '',
    `Archive: ${SITE_URL}/newsletter/archive`,
  ].join('\n')

  await createNewsletterIssue({ subject, body, sendNow: true })
  const delivery = await processNewsletterQueue(1)

  return NextResponse.json({
    ok: true,
    job: JOB,
    candidates: ranked.length,
    empty: false,
    sent: delivery.delivered,
    failed: delivery.failed,
    reason: delivery.delivered > 0 ? 'delivered' : 'queued-or-failed',
    detail: delivery.detail,
    top,
  })
}

export const GET = run
export const POST = run
