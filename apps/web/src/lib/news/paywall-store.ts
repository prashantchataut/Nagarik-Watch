'use client'

/**
 * Paywall store — metered free quota + subscription state.
 * Server state comes from /api/paywall; the client never trusts a local
 * count for enforcement, only for UI hints.
 */

import { useEffect, useSyncExternalStore } from 'react'

export interface PaywallState {
  freeLimit: number
  used: number
  remaining: number
  subscribed: boolean
  plan: string | null
  reasonNe: string | null
  ready: boolean
}

const EMPTY: PaywallState = {
  freeLimit: 8,
  used: 0,
  remaining: 8,
  subscribed: false,
  plan: null,
  reasonNe: null,
  ready: false,
}

let current: PaywallState = EMPTY
const CHANGE_EVENT = 'nagarikwatch:paywall-changed'

function subscribeStore(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('nagarikwatch:auth-changed', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('nagarikwatch:auth-changed', callback)
  }
}

function getSnapshot(): PaywallState {
  return current
}

export function usePaywall(): PaywallState & { refresh: () => void } {
  const state = useSyncExternalStore(subscribeStore, getSnapshot, () => EMPTY)

  const refresh = () => {
    void fetch('/api/paywall', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        current = {
          freeLimit: data.freeLimit ?? 8,
          used: data.used ?? 0,
          remaining: Math.max(0, (data.freeLimit ?? 8) - (data.used ?? 0)),
          subscribed: Boolean(data.subscribed),
          plan: data.plan ?? null,
          reasonNe: data.reasonNe ?? null,
          ready: true,
        }
        window.dispatchEvent(new Event(CHANGE_EVENT))
      })
      .catch(() => undefined)
  }

  useEffect(() => {
    refresh()
  }, [])

  return { ...state, refresh }
}

/** Count one metered article open (server decides enforcement). */
export function recordMeteredView(storyKey: string): void {
  void fetch('/api/paywall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storyKey }),
    keepalive: true,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return
      current = {
        freeLimit: data.freeLimit ?? current.freeLimit,
        used: data.used ?? current.used,
        remaining: Math.max(0, (data.freeLimit ?? 8) - (data.used ?? 0)),
        subscribed: Boolean(data.subscribed),
        plan: data.plan ?? null,
        reasonNe: data.reasonNe ?? null,
        ready: true,
      }
      window.dispatchEvent(new Event(CHANGE_EVENT))
    })
    .catch(() => undefined)
}

/** Cancel the current subscription (profile page). */
export async function cancelSubscription(): Promise<void> {
  await fetch('/api/subscribe', { method: 'DELETE' })
  current = { ...current, subscribed: false, plan: null }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** Start a subscription (demo checkout or real gateway later). */
export async function subscribe(plan: 'monthly' | 'yearly' | 'patron', method = 'demo'): Promise<{ ok: boolean; errorNe?: string }> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, method }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, errorNe: (data as { error?: string }).error ?? 'सदस्यता लिन सकिएन।' }
    current = { ...current, subscribed: true, plan, used: 0, remaining: current.freeLimit }
    window.dispatchEvent(new Event(CHANGE_EVENT))
    return { ok: true }
  } catch {
    return { ok: false, errorNe: 'सञ्जाल त्रुटि।' }
  }
}
