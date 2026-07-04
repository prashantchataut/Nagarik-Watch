/**
 * Live-data MOCK source.
 *
 * ⚠️ TEMPORARY MOCK DATA — NOT FOR PRODUCTION. ⚠️
 *
 * Every value here is hand-written placeholder content so the reader-facing live widgets
 * (weather, AQI, NEPSE, sports, etc.) can be designed, laid out, and reviewed before any
 * real feed exists. Nothing here is a real reading, quote, or score.
 *
 * INTEGRATION CONTRACT (for the backend/live-data agent):
 *   Replace each `getMock*` function with a real fetcher that returns the SAME shape
 *   (`LiveValue<T>`), preserving the `source`, `updatedAt`, and `mock` fields so the UI's
 *   trust affordances (timestamp, source line, MOCK badge) keep working. The widget shell
 *   (`LiveWidget`) already renders loading / error / empty states from these shapes, so the
 *   only thing that changes server-side is where the numbers come from.
 *
 *   Suggested real sources (to be confirmed/licensed by the newsroom):
 *     - Weather/AQI: a licensed weather API or the government meteorology dept feed.
 *     - NEPSE: the official NEPSE / nepalstock feed (or a licensed market-data vendor).
 *     - Sports: a licensed sports-data provider.
 *   Until those are wired, EVERY widget MUST keep `mock: true` so readers are never
 *   misled into treating placeholder data as reporting (PRODUCT.md: reader trust above all).
 */
import type { Locale } from '@nagarikwatch/db'

/** Status of a single live reading. `mock` drives the visible placeholder badge. */
export type LiveStatus = 'ok' | 'loading' | 'error' | 'empty'

/** A wrapped live value carrying its own provenance and freshness, for any widget. */
export interface LiveValue<T> {
  status: LiveStatus
  data?: T
  /** Human-readable source name, shown in the widget footer for trust. */
  source: string
  /** ISO timestamp of the reading. Rendered as a relative "last updated" label. */
  updatedAt: string
  /** True while no real feed is wired. Drives the visible MOCK / नमुना badge. */
  mock: boolean
}

export interface WeatherReading {
  /** Place name, already localized by the caller's locale. */
  placeNe: string
  placeEn: string
  tempC: number
  /** Short condition key, mapped to an icon + localized label in the widget. */
  condition: 'clear' | 'clouds' | 'rain' | 'haze' | 'storm'
}

export interface AqiReading {
  /** US AQI integer (0–500+). */
  aqi: number
  placeNe: string
  placeEn: string
}

export interface NepseReading {
  index: number
  /** Absolute point change vs previous close (sign drives up/down state). */
  change: number
  /** Percent change vs previous close. */
  changePercent: number
  /** Whether the market is currently in a trading session. */
  open: boolean
}

const now = () => new Date().toISOString()

/**
 * TEMPORARY placeholder weather. Kathmandu, plausible monsoon-season values for June.
 * TODO(live-data agent): replace with a licensed weather feed; keep the LiveValue shape.
 */
export function getMockWeather(_locale: Locale): LiveValue<WeatherReading> {
  return {
    status: 'ok',
    data: { placeNe: 'काठमाडौं', placeEn: 'Kathmandu', tempC: 27, condition: 'rain' },
    source: 'Provider fallback',
    updatedAt: now(),
    mock: true,
  }
}

/**
 * TEMPORARY placeholder AQI. A "moderate" band value, deliberately not alarmist.
 * TODO(live-data agent): replace with a real AQI feed; keep the LiveValue shape.
 */
export function getMockAqi(_locale: Locale): LiveValue<AqiReading> {
  return {
    status: 'ok',
    data: { aqi: 86, placeNe: 'काठमाडौं', placeEn: 'Kathmandu' },
    source: 'Provider fallback',
    updatedAt: now(),
    mock: true,
  }
}

/**
 * TEMPORARY placeholder NEPSE index. Plausible values; market shown as open.
 * TODO(live-data agent): replace with the official NEPSE feed; keep the LiveValue shape.
 */
export function getMockNepse(_locale: Locale): LiveValue<NepseReading> {
  return {
    status: 'ok',
    data: { index: 2148.6, change: 12.4, changePercent: 0.58, open: true },
    source: 'Provider fallback',
    updatedAt: now(),
    mock: true,
  }
}
