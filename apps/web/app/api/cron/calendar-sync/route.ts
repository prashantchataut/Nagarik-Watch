import { NextResponse, type NextRequest } from 'next/server'
import { todayBsInKathmandu } from '@nagarikwatch/db'
import { syncCalendarScheduleFromProvider } from '@/lib/calendar-provider'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'

const JOB = 'calendar-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  await recordCronHeartbeat(JOB).catch(() => undefined)
  const year = todayBsInKathmandu().year
  try {
    const schedule = await syncCalendarScheduleFromProvider(year)
    return NextResponse.json({
      ok: true,
      job: JOB,
      year: schedule.year,
      events: schedule.events.length,
      source: schedule.source,
      updatedAt: schedule.updatedAt,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        job: JOB,
        error: error instanceof Error ? error.message : 'Calendar provider sync failed',
      },
      { status: 502 },
    )
  }
}

export const GET = run
export const POST = run
