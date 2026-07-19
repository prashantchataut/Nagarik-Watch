import { NextResponse, type NextRequest } from 'next/server'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'
import { getOpsHealthSnapshot } from '@/lib/ops/health-snapshot'

const JOB = 'ops-probe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Periodic ops anomaly probe: pool saturation + cron miss detection.
 * Never invents CDN/WAF traffic or error rates when none were observed.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  await recordCronHeartbeat(JOB).catch(() => undefined)

  const snapshot = await getOpsHealthSnapshot()
  const missedCrons = snapshot.cron.filter((job) => job.missed).map((job) => job.job)
  const poolHot = snapshot.pool.configured && snapshot.pool.saturation >= 0.85

  return NextResponse.json({
    ok: true,
    job: JOB,
    pool: snapshot.pool,
    missedCrons,
    poolHot,
    errorBudget: snapshot.errorBudget,
    generatedAt: snapshot.generatedAt,
    anomalies: [
      ...(poolHot ? ['pool_saturation_high'] : []),
      ...missedCrons.map((id) => `cron_missed:${id}`),
    ],
  })
}

export const GET = run
export const POST = run
