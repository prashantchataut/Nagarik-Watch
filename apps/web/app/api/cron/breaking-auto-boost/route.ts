import { NextResponse, type NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { runBreakingAutoBoost } from '@/lib/editorial/breaking-auto-boost'

const JOB = 'breaking-auto-boost'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  await recordCronHeartbeat(JOB).catch(() => undefined)
  const result = await runBreakingAutoBoost()
  return NextResponse.json({ ok: true, job: JOB, ...result })
}

export const GET = run
export const POST = run
