import { NextResponse } from 'next/server'
import { AD_PLACEMENTS, type AdMode } from '@/lib/ads'

const events = new Set(['impression', 'click'])
const modes = new Set<AdMode>(['off', 'house', 'network'])

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!isAdEvent(body)) return NextResponse.json({ ok: false }, { status: 400 })

  if (process.env.NODE_ENV !== 'production') {
    console.info('[ad-event]', body.event, body.placementKey, body.mode)
  }

  return NextResponse.json({ ok: true })
}

function isAdEvent(value: unknown): value is { placementKey: keyof typeof AD_PLACEMENTS; mode: AdMode; event: 'impression' | 'click' } {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.placementKey === 'string' &&
    record.placementKey in AD_PLACEMENTS &&
    typeof record.mode === 'string' &&
    modes.has(record.mode as AdMode) &&
    typeof record.event === 'string' &&
    events.has(record.event)
  )
}
