import { NextResponse } from 'next/server'
import { fetchPlaceWeather } from '@/lib/live/fetch-place-weather'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get('slug') ?? 'kathmandu'
  try {
    const reading = await fetchPlaceWeather(slug)
    return NextResponse.json({
      ok: true,
      tempC: reading.tempC,
      aqi: reading.aqi,
      placeSlug: reading.place.slug,
      placeNe: reading.place.placeNe,
      placeEn: reading.place.placeEn,
      source: reading.source,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'weather failed'
    return NextResponse.json({ ok: false, error: message }, { status: 502 })
  }
}
