/**
 * Live-data providers using genuine public or configured upstreams
 * public endpoints, while preserving the LiveValue<T> contract so the widgets,
 * trust lines and failure states remain consistent across widgets.
 *
 * Sources wired (all free, no key, attribution-grade):
 *   - Weather:  Open-Meteo Forecast API   https://open-meteo.com/en/docs
 *   - AQI:      Open-Meteo Air Quality API https://open-meteo.com/en/docs/air-quality-api
 *   - Forex:    Nepal Rastra Bank Forex API https://www.nrb.org.np/api-docs-v1/
 *
 * Resilience policy: every fetch is wrapped so a network/parse failure degrades
 * to an explicit error/empty state rather than fabricating a reading — a failed upstream
 * must never break the homepage render (SPEC.md: non-blocking live widgets).
 *
 * Caching: a short in-process TTL cache (default 5 min) per key so a single
 * homepage render does not hammer the upstreams, and so the UtilityStrip +
 * the utility strip and utility hubs share one fetch per refresh window.
 */
import 'server-only'
import type { Locale } from '@nagarikwatch/db'
import {
  emptyLiveValue,
  failedLiveValue,
  type AqiReading,
  type LiveValue,
  type NepseReading,
  type WeatherReading,
} from './types'
import { getManualLiveRecord } from './manual'
import { isManualForex, isManualGold, isManualNepse } from './manual-schema'
import { execCircuit } from '../resilience/circuit-breaker'

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

/** REAL weather. Provider-aware: uses WEATHER_PROVIDER + WEATHER_API_KEY when set
 *  (meteosource | openweather | weatherstack), otherwise the keyless Open-Meteo feed.
 *  Any failure returns an explicit error state so the homepage remains resilient without invented data. */
export async function getRealWeather(_locale: Locale): Promise<LiveValue<WeatherReading>> {
  const key = 'weather'
  const hit = cached<WeatherReading>(key)
  if (hit) return hit

  const provider = (process.env.WEATHER_PROVIDER ?? 'open-meteo').toLowerCase()
  const apiKey = process.env.WEATHER_API_KEY

  try {
    if (apiKey && provider !== 'open-meteo') {
      const value = await fetchProviderWeather(provider, apiKey)
      if (value) return remember(key, value)
    }
    const value = await execCircuit('open-meteo-weather', async () => {
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
      return {
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
      } satisfies LiveValue<WeatherReading>
    })
    return remember(key, value)
  } catch (error) {
    return failedLiveValue<WeatherReading>('Open-Meteo weather', error)
  }
}

/** Fetch from a keyed weather provider, or null to signal "fall back to Open-Meteo". */
async function fetchProviderWeather(
  provider: string,
  apiKey: string,
): Promise<LiveValue<WeatherReading> | null> {
  const common = { placeNe: 'काठमाडौं', placeEn: 'Kathmandu' }
  if (provider === 'openweather') {
    return execCircuit('openweather', async () => {
      const url =
        `https://api.openweathermap.org/data/2.5/weather?lat=${KTM_LAT}&lon=${KTM_LON}` +
        `&units=metric&appid=${encodeURIComponent(apiKey)}`
      const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
      if (!res.ok) throw new Error(`openweather http ${res.status}`)
      const j = (await res.json()) as { main?: { temp?: number }; weather?: Array<{ id?: number }> }
      const temp = j.main?.temp
      const code = j.weather?.[0]?.id ?? 800
      if (typeof temp !== 'number') throw new Error('openweather shape')
      return {
        status: 'ok',
        data: { ...common, tempC: Math.round(temp), condition: owmCodeToCondition(code) },
        source: 'OpenWeather',
        updatedAt: new Date().toISOString(),
        mock: false,
      }
    })
  }
  if (provider === 'weatherstack') {
    return execCircuit('weatherstack', async () => {
      const url =
        `https://api.weatherstack.com/current?access_key=${encodeURIComponent(apiKey)}` +
        `&query=${KTM_LAT},${KTM_LON}&units=m`
      const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
      if (!res.ok) throw new Error(`weatherstack http ${res.status}`)
      const j = (await res.json()) as {
        current?: { temperature?: number; weather_descriptions?: string[] }
      }
      const temp = j.current?.temperature
      if (typeof temp !== 'number') throw new Error('weatherstack shape')
      return {
        status: 'ok',
        data: {
          ...common,
          tempC: Math.round(temp),
          condition: descriptionToCondition(j.current?.weather_descriptions?.[0]),
        },
        source: 'Weatherstack',
        updatedAt: new Date().toISOString(),
        mock: false,
      }
    })
  }
  if (provider === 'meteosource') {
    return execCircuit('meteosource', async () => {
      const url =
        `https://www.meteosource.com/api/v1/free/point?place_id=kathmandu` +
        `&key=${encodeURIComponent(apiKey)}&units=si`
      const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
      if (!res.ok) throw new Error(`meteosource http ${res.status}`)
      const j = (await res.json()) as {
        current?: { temperature?: number; summary?: string; icon?: string }
      }
      const temp = j.current?.temperature
      if (typeof temp !== 'number') throw new Error('meteosource shape')
      return {
        status: 'ok',
        data: {
          ...common,
          tempC: Math.round(temp),
          condition: descriptionToCondition(j.current?.summary ?? j.current?.icon),
        },
        source: 'Meteosource',
        updatedAt: new Date().toISOString(),
        mock: false,
      }
    })
  }
  return null
}

/** OpenWeatherMap condition code → our set (2xx storm, 5xx rain, 7xx haze, 800 clear). */
function owmCodeToCondition(code: number): WeatherReading['condition'] {
  if (code >= 200 && code < 300) return 'storm'
  if (code >= 300 && code < 600) return 'rain'
  if (code >= 600 && code < 700) return 'rain'
  if (code >= 700 && code < 800) return 'haze'
  return code === 800 ? 'clear' : 'clouds'
}

/** Map a free-text weather description to our condition set. */
function descriptionToCondition(desc?: string): WeatherReading['condition'] {
  const d = (desc ?? '').toLowerCase()
  if (!d) return 'clouds'
  if (d.includes('thunder') || d.includes('storm')) return 'storm'
  if (d.includes('rain') || d.includes('drizzle') || d.includes('shower')) return 'rain'
  if (d.includes('haze') || d.includes('fog') || d.includes('mist') || d.includes('dust'))
    return 'haze'
  if (d.includes('clear') || d.includes('sunny')) return 'clear'
  return 'clouds'
}

/** REAL AQI (US AQI + PM2.5) from Open-Meteo Air Quality. Returns an explicit error state on failure. */
export async function getRealAqi(_locale: Locale): Promise<LiveValue<AqiReading>> {
  const key = 'aqi'
  const hit = cached<AqiReading>(key)
  if (hit) return hit

  try {
    const value = await execCircuit('open-meteo-aqi', async () => {
      const url =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${KTM_LAT}&longitude=${KTM_LON}` +
        `&current=us_aqi&timezone=Asia/Kathmandu`
      const res = await withTimeout(fetch(url, { next: { revalidate: 300 } }), 4000)
      if (!res.ok) throw new Error(`aqi http ${res.status}`)
      const json = (await res.json()) as { current?: { us_aqi?: number } }
      const aqi = json.current?.us_aqi
      if (typeof aqi !== 'number' || !Number.isFinite(aqi)) throw new Error('aqi shape')
      return {
        status: 'ok',
        data: {
          aqi: Math.round(aqi),
          placeNe: 'काठमाडौं',
          placeEn: 'Kathmandu',
        },
        source: 'Open-Meteo Air Quality',
        updatedAt: new Date().toISOString(),
        mock: false,
      } satisfies LiveValue<AqiReading>
    })
    return remember(key, value)
  } catch (error) {
    return failedLiveValue<AqiReading>('Open-Meteo Air Quality', error)
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

/**
 * The forex widget shows NPR against a focused set of currencies that matter to Nepali
 * readers: the majors (USD, EUR, GBP, AUD, CAD, JPY, CNY) plus the high-remittance Gulf
 * and Asian corridors (SAR, AED, MYR, KRW) where millions of Nepali workers send money
 * home. Everything else NRB publishes is dropped to keep the widget scannable.
 */
const FOREX_FOCUS = new Set([
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CAD',
  'JPY',
  'CNY',
  'SAR',
  'AED',
  'MYR',
  'KRW',
])

/** REAL forex rates, NPR against the focus set. Provider-aware:
 * Nepal Rastra Bank daily buy/sell rates are authoritative. A validated newsroom override
 * is used only when NRB is unavailable. Midpoint providers are not converted into invented spreads. */
export async function getRealForex(_locale: Locale): Promise<LiveValue<ForexRate[]>> {
  const key = 'forex'
  const hit = cached<ForexRate[]>(key)
  if (hit) return hit

  try {
    const value = await execCircuit('nrb-forex', async () => {
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
        .filter((r): r is ForexRate => r !== null && FOREX_FOCUS.has(r.iso3))

      if (rates.length === 0) throw new Error('forex empty')
      return {
        status: 'ok',
        data: rates,
        source: 'Nepal Rastra Bank',
        updatedAt: new Date().toISOString(),
        mock: false,
      } satisfies LiveValue<ForexRate[]>
    })
    return remember(key, value)
  } catch (error) {
    const manual = await getManualLiveRecord<unknown>('forex')
    if (manual && isManualForex(manual.data)) {
      return {
        status: 'ok',
        data: manual.data,
        source: manual.source,
        updatedAt: manual.updatedAt,
        mock: false,
      }
    }
    return failedLiveValue<ForexRate[]>('Nepal Rastra Bank', error)
  }
}

/**
 * Third-party midpoint FX feeds are intentionally not mapped into buy/sell values.
 * Nagarik Watch publishes the NRB retail buy/sell pair or a validated newsroom override;
 * inventing a spread around a midpoint would make an indicative quote look authoritative.
 */
type NormalizedNepseResponse = {
  index?: number
  change?: number
  changePercent?: number
  open?: boolean
  source?: string
  updatedAt?: string
  data?: {
    index?: number
    change?: number
    changePercent?: number
    open?: boolean
    source?: string
    updatedAt?: string
  }
}

function liveApiHeaders(prefix: 'NEPSE' | 'GOLD_SILVER'): HeadersInit {
  const apiKey = process.env[`${prefix}_API_KEY`]?.trim()
  if (!apiKey) return {}
  const header = process.env[`${prefix}_API_AUTH_HEADER`]?.trim() || 'Authorization'
  const scheme = process.env[`${prefix}_API_AUTH_SCHEME`]?.trim() ?? 'Bearer'
  return { [header]: scheme ? `${scheme} ${apiKey}` : apiKey }
}

async function fetchConfiguredNepse(): Promise<LiveValue<NepseReading>> {
  const endpoint = process.env.NEPSE_API_URL?.trim()
  if (!endpoint) throw new Error('NEPSE_API_URL is not configured')
  const res = await withTimeout(
    fetch(endpoint, {
      headers: liveApiHeaders('NEPSE'),
      next: { revalidate: 120 },
    }),
    5000,
  )
  if (!res.ok) throw new Error(`NEPSE provider http ${res.status}`)
  const body = (await res.json()) as NormalizedNepseResponse
  const payload = body.data ?? body
  const candidate = {
    index: payload.index,
    change: payload.change,
    changePercent: payload.changePercent,
    open: payload.open,
  }
  if (!isManualNepse(candidate)) {
    throw new Error('NEPSE provider must return index, change, changePercent and open')
  }
  const timestamp = payload.updatedAt ? new Date(payload.updatedAt) : new Date()
  return {
    status: 'ok',
    data: candidate,
    source:
      payload.source?.trim() ||
      process.env.NEPSE_SOURCE_NAME?.trim() ||
      'Licensed NEPSE data provider',
    updatedAt: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
    mock: false,
  }
}

/**
 * NEPSE — a configured licensed JSON feed wins when present. Its normalized
 * contract is {index, change, changePercent, open, source?, updatedAt?}. When
 * no vendor URL is configured, the public nepalstock.com page is a best-effort
 * secondary source. Both paths fail explicitly and may fall back only to a
 * source-labelled newsroom override; no synthetic quote is generated.
 */
export async function getRealNepse(_locale: Locale): Promise<LiveValue<NepseReading>> {
  const key = 'nepse'
  const hit = cached<NepseReading>(key)
  if (hit) return hit

  let lastError: unknown = null
  if (process.env.NEPSE_API_URL?.trim()) {
    try {
      const value = await execCircuit('nepse-configured-provider', fetchConfiguredNepse)
      return remember(key, value)
    } catch (error) {
      lastError = error
    }
  }

  try {
    const value = await execCircuit('nepalstock-nepse', async () => {
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
      return {
        status: 'ok',
        data: { index, change, changePercent, open: isNepseOpenNow() },
        source: 'NEPSE (nepalstock.com)',
        updatedAt: new Date().toISOString(),
        mock: false,
      } satisfies LiveValue<NepseReading>
    })
    return remember(key, value)
  } catch (error) {
    lastError = error
    const manual = await getManualLiveRecord<unknown>('nepse')
    if (manual && isManualNepse(manual.data)) {
      return {
        status: 'ok',
        data: manual.data,
        source: manual.source,
        updatedAt: manual.updatedAt,
        mock: false,
      }
    }
    return failedLiveValue<NepseReading>(
      process.env.NEPSE_API_URL?.trim() ? 'Configured NEPSE provider / nepalstock.com' : 'NEPSE (nepalstock.com)',
      lastError,
    )
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

// --- Gold / Silver ---

export type GoldSilverReading = {
  goldTolaNpr: number
  silverTolaNpr: number
  goldGramNpr: number
  silverGramNpr: number
  unit: string
}

type NormalizedGoldResponse = Partial<GoldSilverReading> & {
  source?: string
  updatedAt?: string
  data?: Partial<GoldSilverReading> & { source?: string; updatedAt?: string }
}

async function fetchConfiguredGoldSilver(): Promise<LiveValue<GoldSilverReading>> {
  const endpoint = process.env.GOLD_SILVER_API_URL?.trim()
  if (!endpoint) throw new Error('GOLD_SILVER_API_URL is not configured')
  const res = await withTimeout(
    fetch(endpoint, {
      headers: liveApiHeaders('GOLD_SILVER'),
      next: { revalidate: 300 },
    }),
    5000,
  )
  if (!res.ok) throw new Error(`Bullion provider http ${res.status}`)
  const body = (await res.json()) as NormalizedGoldResponse
  const payload = body.data ?? body
  const candidate = {
    goldTolaNpr: payload.goldTolaNpr,
    silverTolaNpr: payload.silverTolaNpr,
    goldGramNpr: payload.goldGramNpr,
    silverGramNpr: payload.silverGramNpr,
    unit: payload.unit,
  }
  if (!isManualGold(candidate)) {
    throw new Error('Bullion provider returned an invalid normalized payload')
  }
  const timestamp = payload.updatedAt ? new Date(payload.updatedAt) : new Date()
  return {
    status: 'ok',
    source:
      payload.source?.trim() ||
      process.env.GOLD_SILVER_SOURCE_NAME?.trim() ||
      'Licensed Nepal bullion provider',
    updatedAt: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
    mock: false,
    data: candidate,
  }
}

/**
 * Gold/Silver prices prefer an explicitly configured licensed normalized JSON
 * feed. If none is configured (or it fails), only a source-labelled verified
 * newsroom override is accepted; the product never guesses a Nepal retail rate.
 */
export async function getRealGoldSilver(_locale: Locale): Promise<LiveValue<GoldSilverReading>> {
  const key = 'gold-silver'
  const hit = cached<GoldSilverReading>(key)
  if (hit) return hit

  if (process.env.GOLD_SILVER_API_URL?.trim()) {
    try {
      const value = await execCircuit('gold-silver-configured-provider', fetchConfiguredGoldSilver)
      return remember(key, value)
    } catch (error) {
      const manual = await getManualLiveRecord<unknown>('gold-silver')
      if (manual && isManualGold(manual.data)) {
        return remember(key, {
          status: 'ok',
          source: manual.source,
          updatedAt: manual.updatedAt,
          mock: false,
          data: manual.data,
        })
      }
      return failedLiveValue<GoldSilverReading>('Configured Nepal bullion provider', error)
    }
  }

  const manual = await getManualLiveRecord<unknown>('gold-silver')
  if (manual && isManualGold(manual.data)) {
    return remember(key, {
      status: 'ok',
      source: manual.source,
      updatedAt: manual.updatedAt,
      mock: false,
      data: manual.data,
    })
  }
  return emptyLiveValue<GoldSilverReading>('Newsroom-verified bullion rate')
}
