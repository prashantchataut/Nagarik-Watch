'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Saved-stories book, device-local only (localStorage), per DESIGN.md §8.
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

function getSnapshot(): string {
  return readSavedRaw()
}

function getServerSnapshot(): string {
  return '[]'
}

export function useSaved() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const saved = parseSaved(raw)

  const toggle = useCallback((slug: string) => {
    const current = parseSaved(readSavedRaw())
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug]
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* storage full / private mode — ignore */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
    return next.includes(slug)
  }, [])

  const isSaved = useCallback(
    (slug: string) => saved.includes(slug),
    [saved],
  )

  return { saved, ready: true, toggle, isSaved }
}

/** Client-side poll persistence for the homepage poll-of-the-day. */
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
