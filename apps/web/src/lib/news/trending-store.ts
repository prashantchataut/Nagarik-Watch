'use client'

/**
 * Shared trending fetch — "धेरै पढिएको" storyKey→views map (7-day window).
 * Cached per module so the feed, home rail and recommendations share one poll.
 */

import { useEffect, useState } from 'react'

let cache: { at: number; rows: { storyKey: string; views: number }[] } | null = null
const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

async function ensure(): Promise<{ storyKey: string; views: number }[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.rows
  try {
    const res = await fetch('/api/trending', { cache: 'no-store' })
    const data = (await res.json()) as { trending?: { storyKey: string; views: number }[] }
    cache = { at: Date.now(), rows: data.trending ?? [] }
    notify()
    return cache.rows
  } catch {
    cache = cache ?? { at: Date.now(), rows: [] }
    return cache.rows
  }
}

/** Map of storyKey → views (7 days). Refreshes at most once a minute. */
export function useTrendingMap(): Map<string, number> {
  const [map, setMap] = useState<Map<string, number>>(() => new Map())

  useEffect(() => {
    let cancelled = false
    const update = () => {
      if (!cancelled && cache) {
        setMap(new Map(cache.rows.map((r) => [r.storyKey, r.views])))
      }
    }
    listeners.add(update)
    void ensure().then((rows) => {
      if (!cancelled) setMap(new Map(rows.map((r) => [r.storyKey, r.views])))
    })
    return () => {
      cancelled = true
      listeners.delete(update)
    }
  }, [])

  return map
}
