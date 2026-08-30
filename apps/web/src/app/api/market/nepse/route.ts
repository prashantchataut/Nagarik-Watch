import { NextResponse } from 'next/server'
import { getNepse } from '@/lib/news/market'

export const dynamic = 'force-dynamic'

export async function GET() {
  const nepse = await getNepse()
  return NextResponse.json(nepse)
}
