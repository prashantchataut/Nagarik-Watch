import { NextResponse, type NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { runScheduledPublish } from '@/lib/editorial/scheduled-publish'

const JOB = 'scheduled-publish'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  await recordCronHeartbeat(JOB).catch(() => undefined)
  const result = await runScheduledPublish()
  return NextResponse.json({ ok: true, job: JOB, ...result })
}

export const GET = run
export const POST = run
