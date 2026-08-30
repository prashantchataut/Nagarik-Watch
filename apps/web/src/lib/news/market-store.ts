'use client'

import { useEffect, useSyncExternalStore } from 'react'

/**
 * Live market store — one shared fetch of /api/market/summary for the
 * masthead NEPSE chip, the बजार desk strip and the full market dashboard.
 * Server-side endpoints do the real work (NRB forex, gold-api, NEPSE attempt)
 * with in-memory caching; the client refetches every 5 minutes.
 */

export interface ForexRate {
  iso3: string
  nameNe: string
  unit: number
  buy: number
  sell: number
}

export interface ForexPayload {
  source: 'nrb' | 'fallback'
  dateAd: string
  rates: ForexRate[]
}

export interface MetalsPayload {
  source: 'live' | 'fallback'
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

export interface FuelPrice {
  nameNe: string
  unitNe: string
  price: number
}

export interface MarketSummary {
  forex: ForexPayload
  metals: MetalsPayload
  nepse: NepsePayload
  fuel: { effectiveNe: string; effectiveAd: string; items: FuelPrice[] }
}

const REFRESH_MS = 5 * 60 * 1000

let cached: MarketSummary | null = null
let loading = false
let fetchedAt = 0
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

async function load(force = false) {
  if (loading) return
  if (!force && cached && Date.now() - fetchedAt < REFRESH_MS) return
  loading = true
  try {
    const res = await fetch('/api/market/summary', { cache: 'no-store' })
    if (res.ok) {
      cached = (await res.json()) as MarketSummary
      fetchedAt = Date.now()
      emit()
    }
  } catch {
    /* keep whatever we had */
  } finally {
    loading = false
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  void load()
  return () => {
    listeners.delete(callback)
  }
}

// Periodic refresh while any surface is listening
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (listeners.size > 0) void load(true)
  }, REFRESH_MS)
}

const serverSnapshot = null

export function useMarket(): { market: MarketSummary | null; loading: boolean } {
  const snap = useSyncExternalStore(
    (cb) => {
      const un = subscribe(cb)
      return un
    },
    () => cached,
    () => serverSnapshot,
  )
  useEffect(() => {
    void load()
  }, [])
  return { market: snap, loading: cached === null }
}

/** Force a refresh (e.g. the "अद्यावधिक गर्नुहोस्" button). */
export function refreshMarket() {
  return load(true)
}
