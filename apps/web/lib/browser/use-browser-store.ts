'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Browser-state primitives.
 *
 * Why this module exists: `useState(false)` + `useEffect(() => setState(...))` is
 * the classic way to read `localStorage`, `matchMedia` or the DOM after mount,
 * and it is flagged by `react-hooks/set-state-in-effect` for good reason. It
 * renders twice on every mount, it can desynchronise the server and client
 * markup (a real hydration mismatch source), and it silently drops updates from
 * other tabs.
 *
 * `useSyncExternalStore` is the React-blessed replacement: the server snapshot
 * is a stable neutral value, the client snapshot is the live browser value, and
 * subscriptions keep every consumer in sync.
 */

/** A store that never changes after mount (used for "are we hydrated yet?"). */
const NEVER_CHANGES = () => () => {}

/**
 * `false` on the server and for the first client render, `true` afterwards.
 * Use it to gate markup that can only be correct in the browser, without an
 * effect and without a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  )
}

export type ExternalStore<T> = {
  /** Read the current value. Must be cheap and must return a stable reference. */
  read: () => T
  /** Subscribe to changes; return an unsubscribe function. */
  subscribe: (onChange: () => void) => () => void
  /** Value used during SSR and hydration. Must be stable across renders. */
  serverValue: T
}

/**
 * Subscribe to a browser-owned value (a DOM attribute, `matchMedia`, storage).
 *
 * `store` is intentionally passed as a module-level constant by callers: it is
 * used as the subscription identity, so an inline object would resubscribe on
 * every render.
 */
export function useBrowserStore<T>(store: ExternalStore<T>): T {
  const read = useCallback(() => {
    try {
      return store.read()
    } catch {
      return store.serverValue
    }
  }, [store])
  const serverRead = useCallback(() => store.serverValue, [store])
  return useSyncExternalStore(store.subscribe, read, serverRead)
}

/**
 * Build a `useSyncExternalStore`-friendly store from a read function plus the
 * browser events that should invalidate it.
 */
export function createBrowserStore<T>(options: {
  read: () => T
  serverValue: T
  events?: readonly (keyof WindowEventMap)[]
  customEvents?: readonly string[]
  mediaQueries?: readonly string[]
}): ExternalStore<T> {
  const { read, serverValue, events = [], customEvents = [], mediaQueries = [] } = options
  return {
    read,
    serverValue,
    subscribe: (onChange) => {
      if (typeof window === 'undefined') return () => {}
      for (const event of events) window.addEventListener(event, onChange)
      for (const name of customEvents) window.addEventListener(name, onChange)
      const lists = mediaQueries.map((query) => window.matchMedia(query))
      for (const list of lists) list.addEventListener('change', onChange)
      return () => {
        for (const event of events) window.removeEventListener(event, onChange)
        for (const name of customEvents) window.removeEventListener(name, onChange)
        for (const list of lists) list.removeEventListener('change', onChange)
      }
    },
  }
}

/** Notify every listener of a `createBrowserStore` store after a local write. */
export function notifyBrowserStore(name: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(name))
}
