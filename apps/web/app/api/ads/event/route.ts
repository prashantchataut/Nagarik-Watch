import { NextResponse, type NextRequest } from 'next/server'
import { AD_PLACEMENTS, type AdMode } from '@/lib/ads'
import { recordAdEvent } from '@/lib/ad-events'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

const events = new Set(['impression', 'click'])
const modes = new Set<AdMode>(['off', 'house', 'network'])

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!isAdEvent(body)) return NextResponse.json({ ok: false }, { status: 400 })

  const limited = await enforceRateLimit(
    request,
    `ad-${body.event}`,
    body.event === 'click' ? 20 : 120,
    60_000,
  )
  if (limited) return limited

  await recordAdEvent(body)
  return NextResponse.json({ ok: true })
}

function isAdEvent(value: unknown): value is {
  placementKey: keyof typeof AD_PLACEMENTS
  mode: AdMode
  event: 'impression' | 'click'
  attention?: number
} {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const attentionOk =
    record.attention === undefined ||
    (typeof record.attention === 'number' && Number.isFinite(record.attention) && record.attention >= 0 && record.attention <= 1)
  return (
    typeof record.placementKey === 'string' &&
    record.placementKey in AD_PLACEMENTS &&
    typeof record.mode === 'string' &&
    modes.has(record.mode as AdMode) &&
    typeof record.event === 'string' &&
    events.has(record.event) &&
    attentionOk
  )
}
