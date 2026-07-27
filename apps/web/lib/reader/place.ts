'use client'

import {
  DEFAULT_LIVE_PLACE_SLUG,
  LIVE_PLACE_COOKIE,
  LIVE_PLACE_EVENT,
  LIVE_PLACE_STORAGE_KEY,
  nearestLivePlace,
  resolveLivePlace,
  type LivePlace,
} from '@/lib/live/places'
import { readLocalReaderPreferences, writeLocalReaderPreferences } from '@/lib/reader/preferences'

function writeCookie(slug: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${LIVE_PLACE_COOKIE}=${encodeURIComponent(slug)}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
}

export function readLocalPlaceSlug(): string {
  if (typeof window === 'undefined') return DEFAULT_LIVE_PLACE_SLUG
  try {
    const stored = localStorage.getItem(LIVE_PLACE_STORAGE_KEY)?.trim()
    if (stored) return resolveLivePlace(stored).slug
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LIVE_PLACE_COOKIE}=([^;]*)`))
  if (match?.[1]) return resolveLivePlace(decodeURIComponent(match[1])).slug
  return DEFAULT_LIVE_PLACE_SLUG
}

export function readLocalPlace(): LivePlace {
  return resolveLivePlace(readLocalPlaceSlug())
}

/** Persist place for weather/AQI and bump province follow for local-desk ranking. */
export function writeLocalPlace(slug: string) {
  if (typeof window === 'undefined') return
  const place = resolveLivePlace(slug)
  localStorage.setItem(LIVE_PLACE_STORAGE_KEY, place.slug)
  writeCookie(place.slug)

  const current = readLocalReaderPreferences() ?? {
    categories: [] as string[],
    tags: [] as string[],
    authors: [] as string[],
    provinces: [] as string[],
    breaking: true,
    followedTopics: true,
    followedAuthors: true,
    dailyDigest: false,
    browserAlerts: false,
    quietStart: 22 as number | null,
    quietEnd: 7 as number | null,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kathmandu',
    updatedAt: new Date(0).toISOString(),
  }
  const provinces = [...new Set([place.provinceSlug, ...current.provinces.filter((p) => p !== place.provinceSlug)])]
  writeLocalReaderPreferences({
    ...current,
    provinces,
    updatedAt: new Date().toISOString(),
  })

  window.dispatchEvent(new CustomEvent(LIVE_PLACE_EVENT, { detail: { slug: place.slug } }))
}

export function detectPlaceFromGeolocation(): Promise<LivePlace> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('geolocation unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(nearestLivePlace(position.coords.latitude, position.coords.longitude))
      },
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300_000 },
    )
  })
}

/** True when the reader has explicitly saved or detected a city (not default-only). */
export function hasStoredPlaceChoice(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(LIVE_PLACE_STORAGE_KEY)) return true
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LIVE_PLACE_COOKIE}=([^;]*)`))
  return Boolean(match?.[1])
}

/** On first visit, try geolocation once; fall back to capital reference without blocking UI. */
export function tryAutoDetectPlace(): Promise<LivePlace | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (hasStoredPlaceChoice()) return Promise.resolve(null)
  return detectPlaceFromGeolocation()
    .then((place) => {
      writeLocalPlace(place.slug)
      return place
    })
    .catch(() => null)
}
