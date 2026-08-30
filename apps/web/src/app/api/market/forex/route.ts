import { NextResponse } from 'next/server'
import { getForex } from '@/lib/news/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  const forex = await getForex()
  return NextResponse.json(forex)
}
