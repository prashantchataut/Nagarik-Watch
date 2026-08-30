'use client'

import { useCallback, useSyncExternalStore } from 'react'

/** Theme store backed by localStorage + document class, per DESIGN.md §8. */

type Theme = 'light' | 'dark'
const KEY = 'nagarikwatch:theme'
const CHANGE_EVENT = 'nagarikwatch:theme-changed'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function getSnapshot(): Theme {
  const stored = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  return stored
}

function getServerSnapshot(): Theme {
  return 'light'
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback(() => {
    const next: Theme = document.documentElement.classList.contains('dark')
      ? 'light'
      : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      window.localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return [theme, toggle]
}

/** Apply persisted theme before hydration paint (call from an inline script). */
export function applyPersistedTheme() {
  try {
    const stored = window.localStorage.getItem(KEY)
    if (stored === 'dark') document.documentElement.classList.add('dark')
  } catch {
    /* ignore */
  }
}
