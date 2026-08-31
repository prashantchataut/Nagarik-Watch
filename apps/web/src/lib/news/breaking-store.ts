'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { apiGet } from './api-client'

/**
 * Breaking-news banner — fetched once per mount, dismissible for the
 * current browser session (the newsroom controls it from the editor desk).
 */

export interface Breaking {
  id: string
  textNe: string
  link: string | null
  at: string
}

const DISMISS_KEY = 'nagarikwatch:breaking-dismissed'
const CHANGE_EVENT = 'nagarikwatch:breaking-dismissed-changed'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

function readDismissed(): string {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) ?? ''
  } catch {
    return ''
  }
}

export function useBreaking() {
  const [breaking, setBreaking] = useState<Breaking | null>(null)
  // Session-persisted dismissal, read through useSyncExternalStore (no
  // setState-in-effect; same pattern as the saved-stories store).
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => '')

  useEffect(() => {
    let cancelled = false
    apiGet<{ breaking: Breaking | null }>('/api/breaking')
      .then((json) => {
        if (!cancelled) setBreaking(json.breaking)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = useCallback(() => {
    setBreaking((current) => {
      if (current) {
        try {
          window.sessionStorage.setItem(DISMISS_KEY, current.id)
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
      }
      return current
    })
  }, [])

  const visible = breaking !== null && dismissed !== breaking.id
  return { breaking, visible, dismiss }
}
