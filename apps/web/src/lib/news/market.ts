import 'server-only'

/**
 * Live market data for the बजार desk.
 *
 * Sources (all free, no keys):
 *  - Forex: Nepal Rastra Bank official API  https://www.nrb.org.np/api/forex/v1/rates
 *  - Gold/Silver: https://api.gold-api.com/price/XAU + XAG (international spot, USD/oz)
 *  - NEPSE: attempted live fetch from newweb.nepalstock.com.np (often geo-blocked);
 *    falls back to a clearly-labelled snapshot.
 *
 * Everything is fetched server-side, cached in memory, and served via /api/market/*.
 */

/* ---------------- types ---------------- */

export interface ForexRate {
  iso3: string
  nameNe: string
  unit: number
  buy: number
  sell: number
}

export interface ForexPayload {
  source: 'nrb' | 'fallback'
  dateNe: string
  dateAd: string
  rates: ForexRate[]
}

export interface MetalsPayload {
  source: 'live' | 'fallback'
  /** International spot, USD per troy ounce. */
  goldOzUsd: number
  silverOzUsd: number
  /** Nepal dealer-style tola rates (NPR), computed + calibrated premium. */
  goldTola: number
  goldTola10g: number
  silverTola: number
  usdNpr: number
  updatedAt: string
}

export interface NepsePayload {
  source: 'live' | 'fallback'
  index: { value: number; changeAbs: number; changePct: number }
  sensitive: { value: number; changeAbs: number; changePct: number }
  float: { value: number; changeAbs: number; changePct: number }
  turnover: string
  advancing: number
  declining: number
  unchanged: number
  updatedAt: string
}

/* ---------------- in-memory cache ---------------- */

type CacheEntry<T> = { data: T; at: number }
const cache = new Map<string, CacheEntry<unknown>>()

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T
  try {
    const data = await loader()
    cache.set(key, { data, at: Date.now() })
    return data
  } catch (err) {
    if (hit) return hit.data as T // stale is better than nothing
    throw err
  }
}

const fetchWithTimeout = async (url: string, ms: number, headers?: Record<string, string>) => {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'NagarikWatch/1.0 (+https://nagarikwatch.com)', ...headers },
      cache: 'no-store',
    })
  } finally {
    clearTimeout(t)
  }
}

/* ---------------- NRB forex ---------------- */

const NRB_TO_NE: Record<string, string> = {
  USD: 'अमेरिकी डलर',
  EUR: 'युरो',
  GBP: 'बेलायती पाउन्ड',
  CHF: 'स्विस फ्राङ्क',
  AUD: 'अस्ट्रेलियन डलर',
  CAD: 'क्यानाडियन डलर',
  SGD: 'सिङ्गापुर डलर',
  JPY: 'जापानी येन',
  CNY: 'चिनियाँ युआन',
  INR: 'भारतीय रुपैयाँ',
  SAR: 'साउदी रियाल',
  QAR: 'कतारी रियाल',
  UAE: 'संयुक्त अरब इमिराट्स दिरहम',
  MYR: 'मलेसियन रिङ्गिट',
  KRW: 'कोरियन वोन',
  THB: 'थाई भाट',
  HKD: 'हङकङ डलर',
  BHD: 'बहराइनी दिनार',
  KWD: 'कुवेती दिनार',
  PKR: 'पाकिस्तानी रुपैयाँ',
}

const FALLBACK_FOREX: ForexRate[] = [
  { iso3: 'USD', nameNe: 'अमेरिकी डलर', unit: 1, buy: 152.31, sell: 152.91 },
  { iso3: 'EUR', nameNe: 'युरो', unit: 1, buy: 177.3, sell: 177.99 },
  { iso3: 'GBP', nameNe: 'बेलायती पाउन्ड', unit: 1, buy: 206.88, sell: 207.69 },
  { iso3: 'CHF', nameNe: 'स्विस फ्राङ्क', unit: 1, buy: 189.4, sell: 190.15 },
  { iso3: 'AUD', nameNe: 'अस्ट्रेलियन डलर', unit: 1, buy: 109.62, sell: 110.05 },
  { iso3: 'CAD', nameNe: 'क्यानाडियन डलर', unit: 1, buy: 109.9, sell: 110.34 },
  { iso3: 'SGD', nameNe: 'सिङ्गापुर डलर', unit: 1, buy: 119.84, sell: 120.31 },
  { iso3: 'JPY', nameNe: 'जापानी येन', unit: 10, buy: 10.36, sell: 10.44 },
  { iso3: 'CNY', nameNe: 'चिनियाँ युआन', unit: 1, buy: 21.33, sell: 21.45 },
  { iso3: 'INR', nameNe: 'भारतीय रुपैयाँ', unit: 100, buy: 160.0, sell: 160.15 },
  { iso3: 'QAR', nameNe: 'कतारी रियाल', unit: 1, buy: 41.83, sell: 42.05 },
  { iso3: 'SAR', nameNe: 'साउदी रियाल', unit: 1, buy: 40.6, sell: 40.81 },
  { iso3: 'AED', nameNe: 'अरब इमिराट्स दिरहम', unit: 1, buy: 41.52, sell: 41.73 },
  { iso3: 'MYR', nameNe: 'मलेसियन रिङ्गिट', unit: 1, buy: 32.59, sell: 32.79 },
  { iso3: 'KRW', nameNe: 'कोरियन वोन', unit: 100, buy: 11.4, sell: 11.52 },
  { iso3: 'THB', nameNe: 'थाई भाट', unit: 1, buy: 4.46, sell: 4.53 },
  { iso3: 'HKD', nameNe: 'हङकङ डलर', unit: 1, buy: 19.47, sell: 19.58 },
  { iso3: 'KWD', nameNe: 'कुवेती दिनार', unit: 1, buy: 494.34, sell: 496.6 },
]

export async function getForex(): Promise<ForexPayload> {
  return cached('forex', 2 * 3600 * 1000, async () => {
    const to = new Date()
    const from = new Date(to.getTime() - 4 * 24 * 3600 * 1000) // widen window to survive weekends
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const url = `https://www.nrb.org.np/api/forex/v1/rates?page=1&per_page=1&from=${fmt(from)}&to=${fmt(to)}`
    const res = await fetchWithTimeout(url, 20000)
    if (!res.ok) throw new Error(`NRB HTTP ${res.status}`)
    const json = (await res.json()) as {
      data?: { payload?: { date: string; rates?: { currency?: { iso3?: string; name?: string }; buy?: string | number; sell?: string | number }[] }[] }
    }
    const payload = json.data?.payload?.[0]
    if (!payload?.rates?.length) throw new Error('NRB empty payload')
    const rates: ForexRate[] = payload.rates
      .map((r) => {
        const iso3 = r.currency?.iso3 ?? ''
        const buy = Number(r.buy)
        const sell = Number(r.sell)
        return {
          iso3,
          nameNe: NRB_TO_NE[iso3] ?? r.currency?.name ?? iso3,
          unit: iso3 === 'JPY' ? 10 : iso3 === 'KRW' ? 100 : iso3 === 'INR' ? 100 : 1,
          buy,
          sell,
        }
      })
      .filter((r) => r.iso3 && Number.isFinite(r.buy) && Number.isFinite(r.sell))
    if (rates.length < 5) throw new Error('NRB too few rates')
    return {
      source: 'nrb',
      dateAd: payload.date,
      dateNe: payload.date,
      rates,
    } as ForexPayload
  }).catch(
    (): ForexPayload => ({
      source: 'fallback',
      dateAd: 'पछिल्लो उपलब्ध',
      dateNe: 'पछिल्लो उपलब्ध',
      rates: FALLBACK_FOREX,
    }),
  )
}

/* ---------------- gold / silver ---------------- */

/** 1 tola = 11.664 g = 0.375 troy oz exactly. */
const TOLA_OZ = 0.375
/**
 * Local dealer premium over the pure international conversion — customs duty,
 * making charges and market spread. Calibrated against Kathmandu hallmark
 * rates (mid-Bhadra 2083); shown as an indicative figure, clearly labelled.
 */
const GOLD_PREMIUM = 1.22
const SILVER_PREMIUM = 1.1

export async function getMetals(forex?: ForexPayload): Promise<MetalsPayload> {
  const fx = forex ?? (await getForex())
  const usd = fx.rates.find((r) => r.iso3 === 'USD')
  const usdNpr = usd ? (usd.buy + usd.sell) / 2 : 152.61

  return cached('metals', 30 * 60 * 1000, async () => {
    const [goldRes, silverRes] = await Promise.all([
      fetchWithTimeout('https://api.gold-api.com/price/XAU', 12000),
      fetchWithTimeout('https://api.gold-api.com/price/XAG', 12000),
    ])
    if (!goldRes.ok || !silverRes.ok) throw new Error('gold-api HTTP error')
    const gold = (await goldRes.json()) as { price: number }
    const silver = (await silverRes.json()) as { price: number }
    if (!Number.isFinite(gold.price) || !Number.isFinite(silver.price)) throw new Error('gold-api bad payload')

    const goldTola = Math.round((gold.price * TOLA_OZ * usdNpr * GOLD_PREMIUM) / 100) * 100
    const silverTola = Math.round(silver.price * TOLA_OZ * usdNpr * SILVER_PREMIUM)
    const goldTola10g = Math.round((goldTola / 11.664) * 10)

    return {
      source: 'live',
      goldOzUsd: gold.price,
      silverOzUsd: silver.price,
      goldTola,
      goldTola10g,
      silverTola,
      usdNpr,
      updatedAt: new Date().toISOString(),
    } as MetalsPayload
  }).catch(
    (): MetalsPayload => ({
      source: 'fallback',
      goldOzUsd: 4456.4,
      silverOzUsd: 66.5,
      goldTola: 313100,
      goldTola10g: 268400,
      silverTola: 4810,
      usdNpr,
      updatedAt: new Date().toISOString(),
    }),
  )
}

/* ---------------- NEPSE ---------------- */

export async function getNepse(): Promise<NepsePayload> {
  return cached('nepse', 5 * 60 * 1000, async () => {
    // Official NEPSE endpoint — usually reachable from Nepali IPs; elsewhere it
    // times out and we fall back to the labelled snapshot below.
    const res = await fetchWithTimeout('https://newweb.nepalstock.com.np/api/nots/nepse-data/market-open', 6000)
    if (!res.ok) throw new Error(`NEPSE HTTP ${res.status}`)
    const json = (await res.json()) as unknown
    if (!json || typeof json !== 'object') throw new Error('NEPSE bad payload')
    const obj = json as Record<string, string | number>
    const value = Number(obj.nepseIndex)
    if (!Number.isFinite(value) || value <= 0) throw new Error('NEPSE no index')
    const changePct = Number(obj.nepseIndexPercentageChange ?? 0)
    return {
      source: 'live',
      index: { value, changeAbs: Number(obj.nepseIndexPointChange ?? 0), changePct },
      sensitive: { value: Number(obj.sensitiveIndex ?? 0), changeAbs: 0, changePct: Number(obj.sensitiveIndexPercentageChange ?? 0) },
      float: { value: Number(obj.floatIndex ?? 0), changeAbs: 0, changePct: Number(obj.floatIndexPercentageChange ?? 0) },
      turnover: String(obj.totalTurnover ?? ''),
      advancing: Number(obj.advance ?? 0),
      declining: Number(obj.decline ?? 0),
      unchanged: Number(obj.noChange ?? 0),
      updatedAt: new Date().toISOString(),
    } as NepsePayload
  }).catch(
    (): NepsePayload => ({
      source: 'fallback',
      index: { value: 2557.31, changeAbs: -1.04, changePct: -0.04 },
      sensitive: { value: 519.62, changeAbs: -0.91, changePct: -0.18 },
      float: { value: 187.44, changeAbs: -0.42, changePct: -0.22 },
      turnover: 'रु ३७८.६५ करोड',
      advancing: 94,
      declining: 121,
      unchanged: 38,
      updatedAt: new Date().toISOString(),
    }),
  )
}

/* ---------------- fuel (NOC — no public API, official revision table) ---------------- */

export interface FuelPrice {
  nameNe: string
  unitNe: string
  price: number
  note?: string
}

export const FUEL_PRICES: { effectiveNe: string; effectiveAd: string; items: FuelPrice[] } = {
  effectiveNe: 'वि.सं. २०८३ भदौ मूल्य समायोजन',
  effectiveAd: 'NOC revision, Aug 2026',
  items: [
    { nameNe: 'पेट्रोल', unitNe: 'प्रति लिटर', price: 200.0 },
    { nameNe: 'डिजेल', unitNe: 'प्रति लिटर', price: 195.0 },
    { nameNe: 'केरोसिन', unitNe: 'प्रति लिटर', price: 195.0 },
    { nameNe: 'एलपी ग्यास', unitNe: 'प्रति सिलिन्डर (१४.२ केजी)', price: 2060.0 },
  ],
}
