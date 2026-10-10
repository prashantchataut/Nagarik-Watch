import { NextResponse, type NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { ingestSeismicDrafts } from '@/lib/ingest/official-drafts'

const JOB = 'ingest-official'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Pulls official-source readings into the newsroom as drafts.
 *
 * Nothing here publishes. A failed upstream fetch is reported as a non-ok
 * body with HTTP 200 so the cron runner records a heartbeat rather than
 * retrying a source that is simply down.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  await recordCronHeartbeat(JOB).catch(() => undefined)
  const seismic = await ingestSeismicDrafts()
  return NextResponse.json({
    ok: true,
    job: JOB,
    runs: [seismic],
    created: seismic.created,
  })
}

export const GET = run
export const POST = run
