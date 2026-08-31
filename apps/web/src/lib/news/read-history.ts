'use client'

/**
 * Reading history — anonymous device log of opened stories.
 * Feeds the recommendation engine (desk affinity + tag overlap) and the
 * profile page "हालै पढिएको" list. Logged-in readers also mirror reads
 * server-side through /api/readlog so personalization survives devices.
 */

import { useSyncExternalStore } from 'react'

export interface ReadEntry {
  key: string // "desk/slug"
  desk: string
  tags: string[]
  at: number // epoch ms
}

const KEY = 'nagarikwatch:readlog:v1'
const MAX = 120
const CHANGE_EVENT = 'nagarikwatch:readlog-changed'

// Cached parse — getSnapshot must return a stable reference between writes.
let cachedEntries: ReadEntry[] | null = null

function readAll(): ReadEntry[] {
  if (cachedEntries) return cachedEntries
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    cachedEntries = Array.isArray(parsed) ? (parsed as ReadEntry[]) : []
  } catch {
    cachedEntries = []
  }
  return cachedEntries
}

function writeAll(entries: ReadEntry[]) {
  cachedEntries = entries
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries))
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

const serverSnapshot: ReadEntry[] = []

export function useReadHistory(): ReadEntry[] {
  return useSyncExternalStore(
    subscribe,
    readAll,
    () => serverSnapshot,
  )
}

/** Record one story open (dedup by key; moves entry to the top). */
export function logRead(storyKey: string, desk: string, tags: string[], readerId?: string | null) {
  const rest = readAll().filter((e) => e.key !== storyKey)
  const next = [{ key: storyKey, desk, tags: tags.slice(0, 12), at: Date.now() }, ...rest].slice(
    0,
    MAX,
  )
  writeAll(next)

  // Server mirror for logged-in readers (fire-and-forget; best effort).
  if (readerId) {
    const body = JSON.stringify({ key: storyKey })
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/readlog', new Blob([body], { type: 'application/json' }))
        return
      }
    } catch {
      /* fall through */
    }
    void fetch('/api/readlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined)
  }
}

export function clearReadHistory(): void {
  writeAll([])
}
