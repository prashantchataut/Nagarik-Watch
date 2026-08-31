'use client'

/**
 * Engagement utilities — pageview beacon + anonymous poll voter identity.
 */

const VIEW_SESSION_KEY = 'nagarikwatch:views:v1'
const VOTER_KEY = 'nagarikwatch:voter:v1'

// Analytics beacons require the "all" consent choice (see consent.ts).
import { analyticsAllowed } from './consent'

function readViewed(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(VIEW_SESSION_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/** Count one article view per browser session (beacon, fire-and-forget). */
export function trackView(storyKey: string): void {
  if (!analyticsAllowed()) return
  try {
    const viewed = readViewed()
    if (viewed.has(storyKey)) return
    viewed.add(storyKey)
    window.sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify([...viewed]))
  } catch {
    /* private mode — still send the beacon once */
  }

  const body = JSON.stringify({ key: storyKey })
  const url = '/api/pageview'
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => undefined)
}

/** Stable anonymous key so anonymous poll votes stick to one device. */
export function getVoterKey(): string {
  try {
    const existing = window.localStorage.getItem(VOTER_KEY)
    if (existing) return existing
    const fresh = `anon-${crypto.randomUUID()}`
    window.localStorage.setItem(VOTER_KEY, fresh)
    return fresh
  } catch {
    return 'anon-session'
  }
}
