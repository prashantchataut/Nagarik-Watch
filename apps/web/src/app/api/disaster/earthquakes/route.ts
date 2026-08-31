import { ok } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * Public: live Nepal-region earthquake feed (USGS, 7-day, M2.5+).
 * USGS is a reliable public API; falls back to an empty envelope so the
 * विपद् केन्द्र stays up when the upstream is slow.
 */
const NEPAL = { minLat: 25.8, maxLat: 31.5, minLon: 80, maxLon: 89.5 }

export interface Quake {
  id: string
  mag: number
  place: string
  time: number
  url: string
  lat: number
  lon: number
}

let cache: { at: number; data: Quake[] } | null = null

export async function GET() {
  if (cache && Date.now() - cache.at < 5 * 60_000) {
    return ok({ quakes: cache.data, source: 'usgs', cached: true })
  }
  try {
    const res = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson',
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(6000) },
    )
    if (!res.ok) throw new Error('usgs http error')
    const json = (await res.json()) as {
      features?: Array<{
        id?: string
        properties?: { mag?: number; place?: string; time?: number; url?: string }
        geometry?: { coordinates?: number[] }
      }>
    }
    const quakes: Quake[] = (json.features ?? [])
      .filter((f) => {
        const lon = f.geometry?.coordinates?.[0]
        const lat = f.geometry?.coordinates?.[1]
        return (
          typeof lon === 'number' && typeof lat === 'number' &&
          lat >= NEPAL.minLat && lat <= NEPAL.maxLat && lon >= NEPAL.minLon && lon <= NEPAL.maxLon
        )
      })
      .map((f) => ({
        id: f.id ?? '',
        mag: Number(f.properties?.mag ?? 0),
        place: f.properties?.place ?? 'नेपाल क्षेत्र',
        time: Number(f.properties?.time ?? 0),
        url: f.properties?.url ?? '',
        lat: f.geometry?.coordinates?.[1] ?? 0,
        lon: f.geometry?.coordinates?.[0] ?? 0,
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10)

    cache = { at: Date.now(), data: quakes }
    return ok({ quakes, source: 'usgs', cached: false })
  } catch {
    return ok({ quakes: cache?.data ?? [], source: 'usgs', cached: true, degraded: true })
  }
}
