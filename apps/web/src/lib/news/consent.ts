'use client'

/**
 * Cookie/consent store — EU-style consent, Nepal-context copy.
 * "necessary" only blocks analytics beacons + ad personalization.
 * "all" enables pageview analytics + ad measurement.
 * Persisted in localStorage AND a first-party cookie so any future
 * server-side reading works; accessible from the footer and profile page.
 */

import { useSyncExternalStore } from 'react'

export type ConsentChoice = 'necessary' | 'all'
const KEY = 'nagarikwatch:consent:v1'
const COOKIE = 'nw_consent'
const CHANGE_EVENT = 'nagarikwatch:consent-changed'

function readChoice(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw === 'necessary' || raw === 'all') return raw
    // migrate from cookie if localStorage was cleared
    const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`))
    if (m && (m[1] === 'necessary' || m[1] === 'all')) return m[1] as ConsentChoice
  } catch {
    /* private mode */
  }
  return null
}

function persist(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(KEY, choice)
    document.cookie = `${COOKIE}=${choice}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
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

const emptySnapshot: ConsentChoice | null = null

export function useConsent(): {
  choice: ConsentChoice | null
  decided: boolean
  set: (choice: ConsentChoice) => void
} {
  const choice = useSyncExternalStore(
    subscribe,
    () => readChoice() ?? emptySnapshot,
    () => emptySnapshot,
  )
  return {
    choice,
    decided: choice !== null,
    set: (c) => {
      persist(c)
    },
  }
}

/** Analytics (pageview beacons) allowed? Necessary-only = no. */
export function analyticsAllowed(): boolean {
  return readChoice() === 'all'
}

/** Ad measurement allowed? Same gate as analytics for now. */
export function adMeasurementAllowed(): boolean {
  return readChoice() === 'all'
}
