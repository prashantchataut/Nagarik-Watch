import { NextResponse } from 'next/server'
import { collectWebHealth } from '@/lib/ops/web-health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await collectWebHealth()
  return NextResponse.json(snapshot, {
    status: snapshot.status === 'degraded' ? 503 : 200,
    headers: { 'cache-control': 'no-store, max-age=0' },
  })
}
