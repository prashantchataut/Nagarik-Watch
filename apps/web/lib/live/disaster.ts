import 'server-only'
import type { AlertData, LiveDataEnvelope } from '@/lib/live-data'
import { getManualLiveRecord } from './manual'

const NEPAL = { minLat: 25.8, maxLat: 31.5, minLon: 80, maxLon: 89.5 }
const TTL = 5 * 60_000
let cached: { at: number; value: LiveDataEnvelope<AlertData[]> } | null = null

function inside(coordinates: number[]) {
  const lon = coordinates[0]
  const lat = coordinates[1]
  return typeof lon === 'number' && typeof lat === 'number' && lat >= NEPAL.minLat && lat <= NEPAL.maxLat && lon >= NEPAL.minLon && lon <= NEPAL.maxLon
}
function severity(magnitude: number): AlertData['severity'] { return magnitude >= 5 ? 'warning' : magnitude >= 4 ? 'watch' : 'info' }

export async function getDisasterAlerts(): Promise<LiveDataEnvelope<AlertData[]>> {
  const manual = await getManualLiveRecord<AlertData[]>('disaster-alerts')
  if (manual) return { status: manual.data.length ? 'ok' : 'empty', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
  if (cached && Date.now() - cached.at < TTL) return cached.value
  try {
    const endpoint = process.env.DISASTER_ALERT_API_URL ?? 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
    const response = await fetch(endpoint, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) })
    if (!response.ok) throw new Error(`Disaster feed HTTP ${response.status}`)
    const json = await response.json() as { features?: Array<{ id?: string; properties?: { mag?: number; place?: string; time?: number; url?: string; title?: string }; geometry?: { coordinates?: number[] } }> }
    const alerts = (json.features ?? []).filter((feature) => feature.geometry?.coordinates && inside(feature.geometry.coordinates)).map((feature) => { const mag=Number(feature.properties?.mag ?? 0); return { id: feature.id, severity: severity(mag), title: feature.properties?.title ?? `M ${mag.toFixed(1)} earthquake`, area: feature.properties?.place ?? 'Nepal region', occurredAt: feature.properties?.time ? new Date(feature.properties.time).toISOString() : undefined, url: feature.properties?.url, detail: `Magnitude ${mag.toFixed(1)}` } satisfies AlertData }).sort((a,b)=>(b.occurredAt??'').localeCompare(a.occurredAt??'')).slice(0,12)
    const value: LiveDataEnvelope<AlertData[]> = { status: alerts.length ? 'ok' : 'empty', source: endpoint.includes('usgs.gov') ? 'USGS Earthquake Hazards Program' : 'Configured disaster alert provider', updatedAt: new Date().toISOString(), data: alerts }
    cached = { at: Date.now(), value }; return value
  } catch (error) {
    return { status: 'error', source: 'Disaster alert provider', updatedAt: new Date().toISOString(), data: [], error: error instanceof Error ? error.message : 'Alert fetch failed' }
  }
}
