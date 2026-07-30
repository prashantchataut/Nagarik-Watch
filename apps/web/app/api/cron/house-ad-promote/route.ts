import { NextResponse, type NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { promoteHouseAdWinners } from '@/lib/ads/house-ad-promote'

const JOB = 'house-ad-promote'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  await recordCronHeartbeat(JOB).catch(() => undefined)
  const result = await promoteHouseAdWinners()
  return NextResponse.json({ ok: true, job: JOB, ...result })
}

export const GET = run
export const POST = run
