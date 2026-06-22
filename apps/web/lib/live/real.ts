/**
 * REAL live-data source — replaces the mock feed with genuine free, no-API-key
 * public endpoints, while preserving the LiveValue<T> contract so the widgets,
 * trust lines, and MOCK badges all keep working unchanged.
 *
 * Sources wired (all free, no key, attribution-grade):
 *   - Weather:  Open-Meteo Forecast API   https://open-meteo.com/en/docs
 *   - AQI:      Open-Meteo Air Quality API https://open-meteo.com/en/docs/air-quality-api
 *   - Forex:    Nepal Rastra Bank Forex API https://www.nrb.org.np/api-docs-v1/
 *
 * Resilience policy: every fetch is wrapped so a network/parse failure degrades
 * to the mock value with `mock: true` rather than throwing — a failed upstream
 * must never break the homepage render (SPEC.md: non-blocking live widgets).
 *
 * Caching: a short in-process TTL cache (default 5 min) per key so a single
 * homepage render does not hammer the upstreams, and so the UtilityStrip +
 * HomeLiveBoard (both server components) share one fetch per refresh window.
 */
import 'server-only'
import type { Locale } from '@nagarikwatch/db'
import {
  getMockWeather,
  getMockAqi,
  getMockNepse,
  type AqiReading,
  type LiveValue,
  type NepseReading,
  type WeatherReading,
} from './mock'

const KTM_LAT = 27.7172
const KTM_LON = 85.324
const TTL_MS = 5 * 60_000

type CacheEntry = { at: number; value: LiveValue<unknown> }
const cache = new Map<string, CacheEntry>()

function cached<T>(key: string): LiveValue<T> | null {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as LiveValue<T>
  return null
}

function remember<T>(key: string, value: LiveValue<T>): LiveValue<T> {
  cache.set(key, { at: Date.now(), value })
  return value
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('live-data timeout')), ms),
  )
  return Promise.race([promise, timer])
}

const WEATHER_CODE_MAP: Record<number, WeatherReading['condition']> = {
  0: 'clear',
  1: 'clear',
  2: 'clouds',
  3: 'clouds',
  45: 'haze',
  48: 'haze',
  51: 'rain',
  53: 'rain',
  55: 'rain',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  71: 'rain',
  73: 'rain',
  75: 'rain',
  80: 'rain',
  81: 'rain',
  82: 'rain',
  95: 'storm',
  96: 'storm',
  99: 'storm',
}

function weatherCodeToCondition(code: number): WeatherReading['condition'] {
  return WEATHER_CODE_MAP[code] ?? 'clouds'
}

/** REAL weather from Open-Meteo. Falls back to mock on any failure. */
export async function getRealWeather(_locale: Locale): Promise<LiveValue<WeatherReading>> {
  const key = 'weather'
  const hit = cached<WeatherReading>(key)
  if (hit) return hit

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${KTM_LAT}&longitude=${KTM_LON}` +
      `&current=temperature_2m,weather_code&timezone=Asia/Kathmandu`
    const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
    if (!res.ok) throw new Error(`weather http ${res.status}`)
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number }
    }
    const cur = json.current
    if (!cur || typeof cur.temperature_2m !== 'number' || typeof cur.weather_code !== 'number') {
      throw new Error('weather shape')
    }
    const value: LiveValue<WeatherReading> = {
      status: 'ok',
      data: {
        placeNe: 'काठमाडौं',
        placeEn: 'Kathmandu',
        tempC: Math.round(cur.temperature_2m),
        condition: weatherCodeToCondition(cur.weather_code),
      },
      source: 'Open-Meteo',
      updatedAt: new Date().toISOString(),
      mock: false,
    }
    return remember(key, value)
  } catch {
    return getMockWeather(_locale)
  }
}

/** REAL AQI (US AQI + PM2.5) from Open-Meteo Air Quality. Falls back to mock. */
export async function getRealAqi(locale: Locale): Promise<LiveValue<AqiReading>> {
  const key = 'aqi'
  const hit = cached<AqiReading>(key)
  if (hit) return hit

  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${KTM_LAT}&longitude=${KTM_LON}` +
      `&current=us_aqi&timezone=Asia/Kathmandu`
    const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
    if (!res.ok) throw new Error(`aqi http ${res.status}`)
    const json = (await res.json()) as { current?: { us_aqi?: number } }
    const aqi = json.current?.us_aqi
    if (typeof aqi !== 'number' || !Number.isFinite(aqi)) throw new Error('aqi shape')
    const value: LiveValue<AqiReading> = {
      status: 'ok',
      data: {
        aqi: Math.round(aqi),
        placeNe: 'काठमाडौं',
        placeEn: 'Kathmandu',
      },
      source: 'Open-Meteo Air Quality',
      updatedAt: new Date().toISOString(),
      mock: false,
    }
    return remember(key, value)
  } catch {
    return getMockAqi(locale)
  }
}

type NrbForexPayload = {
  data?: {
    payload?: Array<{
      currency?: { name?: string; iso3?: string }
      rates?: Array<{ buy?: string; sell?: string }>
    }>
  }
}

export type ForexRate = { iso3: string; name: string; buy: number; sell: number; unit: string }

/** REAL forex rates from Nepal Rastra Bank. Falls back to empty list on failure. */
export async function getRealForex(_locale: Locale): Promise<LiveValue<ForexRate[]>> {
  const key = 'forex'
  const hit = cached<ForexRate[]>(key)
  if (hit) return hit

  try {
    const today = new Date().toISOString().slice(0, 10)
    const url = `https://www.nrb.org.np/api/forex/v1/rates?from=${today}&to=${today}&per_page=10`
    const res = await withTimeout(fetch(url, { next: { revalidate: 600 } }), 5000)
    if (!res.ok) throw new Error(`forex http ${res.status}`)
    const json = (await res.json()) as NrbForexPayload
    const payload = json.data?.payload ?? []
    const rates: ForexRate[] = payload
      .map((p) => {
        const r = p.rates?.[0]
        const buy = r?.buy ? Number(r.buy) : NaN
        const sell = r?.sell ? Number(r.sell) : NaN
        if (!Number.isFinite(buy) || !Number.isFinite(sell)) return null
        return {
          iso3: p.currency?.iso3 ?? '',
          name: p.currency?.name ?? p.currency?.iso3 ?? '',
          buy,
          sell,
          unit: 'NPR',
        }
      })
      .filter((r): r is ForexRate => r !== null && r.iso3 !== '')

    if (rates.length === 0) throw new Error('forex empty')
    const value: LiveValue<ForexRate[]> = {
      status: 'ok',
      data: rates,
      source: 'Nepal Rastra Bank',
      updatedAt: new Date().toISOString(),
      mock: false,
    }
    return remember(key, value)
  } catch {
    return {
      status: 'ok',
      data: [],
      source: 'Mock feed',
      updatedAt: new Date().toISOString(),
      mock: true,
    }
  }
}

/**
 * NEPSE — scraped from the public nepalstock.com homepage snippet (no official
 * JSON API exists free of charge). This is intentionally best-effort: any
 * layout change upstream degrades cleanly to the mock value. The mock is kept
 * so the widget never renders an empty market slot mid-session.
 *
 * Note: fetch target is confirmed at wire-time. If nepalstock.com blocks the
 * edge runtime or changes markup, the catch returns mock — no reader-facing
 * breakage.
 */
export async function getRealNepse(locale: Locale): Promise<LiveValue<NepseReading>> {
  const key = 'nepse'
  const hit = cached<NepseReading>(key)
  if (hit) return hit

  try {
    const res = await withTimeout(
      fetch('https://www.nepalstock.com/', {
        headers: { 'user-agent': 'NagarikWatch/1.0 (+https://nagarikwatch.com)' },
        next: { revalidate: 120 },
      }),
      5000,
    )
    if (!res.ok) throw new Error(`nepse http ${res.status}`)
    const html = await res.text()

    const index = extractNepseIndex(html)
    const change = extractNepseChange(html)
    if (!Number.isFinite(index) || !Number.isFinite(change)) throw new Error('nepse parse')

    const prevClose = index - change
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0
    const value: LiveValue<NepseReading> = {
      status: 'ok',
      data: {
        index,
        change,
        changePercent,
        open: isNepseOpenNow(),
      },
      source: 'NEPSE (nepalstock.com)',
      updatedAt: new Date().toISOString(),
      mock: false,
    }
    return remember(key, value)
  } catch {
    return getMockNepse(locale)
  }
}

function extractNepseIndex(html: string): number {
  const m = html.match(/NEPSE[^0-9-]*([0-9]{3,4}\.[0-9]{2})/i)
  return m ? Number(m[1]) : NaN
}

function extractNepseChange(html: string): number {
  const m = html.match(/([+-]?[0-9]+\.[0-9]{2})\s*\([^)]*\)/)
  if (!m) return NaN
  const raw = html.match(/(-?[0-9]+\.[0-9]{2})/)
  return raw ? Number(raw[1]) : NaN
}

/** NEPSE trades roughly 11:00–15:00 NPT, Sun–Thu. NPT = UTC+5:45. */
function isNepseOpenNow(now = new Date()): boolean {
  const nptMs = now.getTime() + 5.75 * 3_600_000
  const npt = new Date(nptMs)
  const day = npt.getUTCDay()
  if (day === 6 || day === 0) return false
  const hour = npt.getUTCHours()
  return hour >= 11 && hour < 15
}
