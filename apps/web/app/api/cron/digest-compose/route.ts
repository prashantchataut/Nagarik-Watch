import { NextResponse, type NextRequest } from 'next/server'
import { getStories } from '@/lib/content'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { digestScore, rankDigestStories } from '@/lib/reader/digest'

const JOB = 'digest-compose'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Composes a morning-digest candidate list from live published stories.
 * Honest empty state when the corpus is empty — never fabricates articles.
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

  return NextResponse.json({
    ok: true,
    job: JOB,
    candidates: ranked.length,
    empty: ranked.length === 0,
    top,
  })
}

export const GET = run
export const POST = run
