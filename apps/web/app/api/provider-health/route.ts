import { NextResponse } from 'next/server'
import { getProviderHealth } from '@/lib/live/health'

export const dynamic = 'force-dynamic'

export async function GET() {
  const providers = await getProviderHealth()
  return NextResponse.json({
    status: providers.some((provider) => provider.status === 'error') ? 'degraded' : 'ok',
    updatedAt: new Date().toISOString(),
    providers,
  })
}
