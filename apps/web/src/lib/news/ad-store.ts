'use client'

/**
 * Ad store — labeled ad slots served from /api/ads with house-ad fallback.
 * Impressions/clicks beacon back when consent allows measurement.
 */

import { useEffect, useSyncExternalStore } from 'react'
import { adMeasurementAllowed } from './consent'

export type AdPlacement = 'leaderboard' | 'infeed' | 'sidebar' | 'article_inline'

export interface AdCampaign {
  id: string
  name: string
  placement: string
  title: string
  body: string | null
  ctaLabel: string | null
  link: string | null
  image: string | null
  accent: string
}

const CACHE_TTL = 60_000
const EMPTY_ADS: AdCampaign[] = []
const cache = new Map<string, { at: number; ads: AdCampaign[] }>()
const CHANGE_EVENT = 'nagarikwatch:ads-changed'
const shown = new Set<string>()

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  return () => window.removeEventListener(CHANGE_EVENT, callback)
}

function snapshotPlacement(placement: AdPlacement): AdCampaign[] {
  const hit = cache.get(placement)
  return hit ? hit.ads : EMPTY_ADS
}

export function useAd(placement: AdPlacement, rotate = false): AdCampaign | null {
  const ads = useSyncExternalStore(
    subscribe,
    () => snapshotPlacement(placement),
    () => EMPTY_ADS,
  )

  useEffect(() => {
    const hit = cache.get(placement)
    if (hit && Date.now() - hit.at < CACHE_TTL) return
    let cancelled = false
    void fetch(`/api/ads?placement=${placement}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { ads: [] }))
      .then((data: { ads?: AdCampaign[] }) => {
        if (cancelled) return
        cache.set(placement, { at: Date.now(), ads: data.ads ?? [] })
        window.dispatchEvent(new Event(CHANGE_EVENT))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [placement])

  if (ads.length === 0) return null
  if (rotate) {
    const slot = Math.floor(Date.now() / 30_000) % ads.length
    return ads[slot] ?? null
  }
  return ads[0] ?? null
}

/** Report an impression once per campaign per page view (when allowed). */
export function trackImpression(id: string): void {
  if (shown.has(id)) return
  shown.add(id)
  if (!adMeasurementAllowed()) return
  void fetch('/api/ads/impression', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    keepalive: true,
  }).catch(() => undefined)
}

/** Click-through (when allowed). */
export function trackClick(id: string): void {
  if (!adMeasurementAllowed()) return
  void fetch('/api/ads/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
    keepalive: true,
  }).catch(() => undefined)
}

export function formatDevanagariCount(n: number): string {
  if (n >= 100000) return `${toNe(Math.floor(n / 100000))} लाख`
  if (n >= 1000) return `${toNe((n / 1000).toFixed(n >= 10000 ? 0 : 1))} हजार`
  return toNe(n)
}

export function toNe(v: number | string): string {
  const digits = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९', '.': '.' } as Record<string, string>
  return String(v)
    .split('')
    .map((ch) => digits[ch] ?? ch)
    .join('')
}
