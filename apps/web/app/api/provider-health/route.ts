import { NextResponse } from 'next/server'
import { getNewsroomSession } from '@/lib/auth/session'
import { getProviderHealth } from '@/lib/live/health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getNewsroomSession()
  if (!session) {
    return NextResponse.json({ error: 'Newsroom access required.' }, { status: 401 })
  }

  const providers = await getProviderHealth()
  return NextResponse.json(
    {
      status: providers.some((provider) => provider.status === 'error') ? 'degraded' : 'ok',
      updatedAt: new Date().toISOString(),
      providers,
    },
    { headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}
