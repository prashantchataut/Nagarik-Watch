'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'
import { currentMe, onAuthChange } from './auth-store'

/**
 * Saved-stories book, per DESIGN.md §8.
 * Anonymous readers: localStorage only (this device).
 * Logged-in readers: server-synced account bookmarks — merged on login,
 * then every toggle pushes the full list (idempotent PUT).
 * Implemented with useSyncExternalStore so localStorage is read once on the
 * client and re-read only when the store actually changes.
 */

const KEY = 'nagarikwatch:saved:v1'
const POLL_KEY = 'nagarikwatch:poll:v1'
const CHANGE_EVENT = 'nagarikwatch:store-changed'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function readSavedRaw(): string {
  try {
    return window.localStorage.getItem(KEY) ?? '[]'
  } catch {
    return '[]'
  }
}

function parseSaved(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeSaved(keys: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(keys))
  } catch {
    /* storage full / private mode — ignore */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function getSnapshot(): string {
  return readSavedRaw()
}

function getServerSnapshot(): string {
  return '[]'
}

/* ---------------- server sync (logged-in readers) ---------------- */

let serverSyncedFor: string | null = null
let syncing = false

async function pushKeys(keys: string[]) {
  try {
    await fetch('/api/bookmarks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: keys.slice(0, 500) }),
    })
  } catch {
    /* offline — local state stays authoritative, retried on next toggle */
  }
}

async function syncFromServer(readerId: string) {
  if (syncing || serverSyncedFor === readerId) return
  syncing = true
  try {
    const res = await fetch('/api/bookmarks', { cache: 'no-store' })
    if (res.ok) {
      const json = (await res.json()) as { keys?: string[] }
      const serverKeys = json.keys ?? []
      const localKeys = parseSaved(readSavedRaw())
      const merged = [...new Set([...serverKeys, ...localKeys])]
      writeSaved(merged)
      const changed =
        merged.length !== serverKeys.length || serverKeys.some((k) => !localKeys.includes(k))
      if (changed) await pushKeys(merged)
    }
    serverSyncedFor = readerId
  } catch {
    /* keep local; will retry on next login/mount */
  } finally {
    syncing = false
  }
}

function watchAuthForSync() {
  const me = currentMe()
  if (me?.kind === 'reader') void syncFromServer(me.id)
  else serverSyncedFor = null
}

export function useSaved() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const saved = parseSaved(raw)

  // Merge account bookmarks on login (and after every auth change).
  useEffect(() => {
    watchAuthForSync()
    return onAuthChange(watchAuthForSync)
  }, [])

  const toggle = useCallback((slug: string) => {
    const current = parseSaved(readSavedRaw())
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug]
    writeSaved(next)
    const me = currentMe()
    if (me?.kind === 'reader') {
      serverSyncedFor = me.id
      void pushKeys(next)
    }
    return next.includes(slug)
  }, [])

  const isSaved = useCallback(
    (slug: string) => saved.includes(slug),
    [saved],
  )

  return { saved, ready: true, toggle, isSaved }
}

/** Client-side poll persistence fallback (used by tools, not the live poll). */
function readPollRaw(): string {
  try {
    return window.localStorage.getItem(POLL_KEY) ?? '{}'
  } catch {
    return '{}'
  }
}

export function usePollChoice(pollId: string) {
  const raw = useSyncExternalStore(subscribe, readPollRaw, () => '{}')

  let choice: string | null = null
  try {
    const parsed = JSON.parse(raw) as Record<string, string>
    choice = parsed[pollId] ?? null
  } catch {
    choice = null
  }

  const vote = useCallback(
    (option: string) => {
      try {
        const parsed = JSON.parse(readPollRaw()) as Record<string, string>
        parsed[pollId] = option
        window.localStorage.setItem(POLL_KEY, JSON.stringify(parsed))
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(CHANGE_EVENT))
    },
    [pollId],
  )

  return { choice, vote }
}
