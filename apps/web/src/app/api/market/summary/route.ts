import { NextResponse } from 'next/server'
import { getForex, getMetals, getNepse, FUEL_PRICES } from '@/lib/news/market'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/** Combined market summary for masthead chips and the बजार dashboard. */
export async function GET() {
  const forex = await getForex()
  const [metals, nepse] = await Promise.all([getMetals(forex), getNepse()])
  return NextResponse.json({ forex, metals, nepse, fuel: FUEL_PRICES })
}
