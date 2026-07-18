import { NextResponse, type NextRequest } from 'next/server'
import { assignAndRecordExperiment, type ExperimentEventType } from '@/lib/experiments/store'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'experiments', 30, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const experimentId = String(body.experimentId ?? '').trim()
  const visitorKey = String(body.visitorKey ?? '').trim()
  const eventType = String(body.eventType ?? '') as ExperimentEventType
  if (
    !experimentId ||
    experimentId.length > 80 ||
    !visitorKey ||
    visitorKey.length > 200 ||
    (eventType !== 'exposure' && eventType !== 'conversion')
  ) {
    return NextResponse.json({ error: 'Invalid experiment event.' }, { status: 400 })
  }

  const result = await assignAndRecordExperiment({ experimentId, visitorKey, eventType })
  if (!result) {
    return NextResponse.json({ error: 'Experiment is not active.' }, { status: 404 })
  }
  return NextResponse.json(result)
}

