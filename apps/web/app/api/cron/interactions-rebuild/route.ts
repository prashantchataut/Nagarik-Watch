import { NextResponse, type NextRequest } from 'next/server'
import { getInteractionMatrix, matrixReaderCount } from '@/lib/engagement/interaction-matrix'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'

const JOB = 'interactions-rebuild'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Rebuilds / materializes the consented CF interaction matrix snapshot.
 * Does not invent readers or weights — only reports what already exists.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  await recordCronHeartbeat(JOB).catch(() => undefined)

  const matrix = await getInteractionMatrix(5_000)
  const readers = matrixReaderCount(matrix)
  let interactions = 0
  for (const row of Object.values(matrix)) {
    interactions += Object.keys(row).length
  }

  return NextResponse.json({
    ok: true,
    job: JOB,
    readers,
    interactions,
    empty: readers === 0,
    detail:
      readers === 0
        ? 'No consented interactions recorded yet — CF stays cold until real reading events arrive.'
        : `Matrix ready for ${readers} readers / ${interactions} interactions.`,
  })
}

export const GET = run
export const POST = run
