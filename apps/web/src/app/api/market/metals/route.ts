import { NextResponse } from 'next/server'
import { getMetals } from '@/lib/news/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  const metals = await getMetals()
  return NextResponse.json(metals)
}
