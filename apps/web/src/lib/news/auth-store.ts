'use client'

import { useCallback, useEffect, useSyncExternalStore } from 'react'

/**
 * Client-side session store for reader + journalist accounts.
 * Backed by the /api/auth/* endpoints (httpOnly cookie sessions in Prisma).
 * useSyncExternalStore keeps every mounted surface in sync after login/logout.
 */

export type Me =
  | { kind: 'reader'; id: string; name: string; email: string }
  | {
      kind: 'journalist'
      id: string
      name: string
      email: string
      desk: string
      role: string // "reporter" | "editor"
      bio: string | null
    }
  | null

let cached: { me: Me; version: number } | null = null
let version = 0
const listeners = new Set<() => void>()

function emit() {
  version += 1
  for (const l of listeners) l()
}

export async function refreshMe(): Promise<Me> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    const json = (await res.json()) as { me: Me }
    cached = { me: json.me, version }
    emit()
    return json.me
  } catch {
    return cached?.me ?? null
  }
}

async function post<T>(url: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(json.error ?? 'अज्ञात त्रुटि')
  return json
}

export async function readerSignup(name: string, email: string, password: string) {
  await post('/api/auth/reader/signup', { name, email, password })
  await refreshMe()
}

export async function readerLogin(email: string, password: string) {
  await post('/api/auth/reader/login', { email, password })
  await refreshMe()
}

export async function journalistLogin(email: string, password: string) {
  await post('/api/auth/journalist/login', { email, password })
  await refreshMe()
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  cached = { me: null, version }
  emit()
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/** Subscribe to session changes (login / logout / refresh). */
export function onAuthChange(callback: () => void): () => void {
  return subscribe(callback)
}

/** Current cached session (may be null before the first /api/auth/me). */
export function currentMe(): Me {
  return cached?.me ?? null
}

const serverSnapshot = { me: null as Me, version: 0 }

export function useMe(): { me: Me; ready: boolean } {
  const snap = useSyncExternalStore(
    subscribe,
    () => cached ?? serverSnapshot,
    () => serverSnapshot,
  )
  // Fetch session once per mount cycle (idempotent, cached in module state)
  useEffect(() => {
    if (cached) return
    void refreshMe()
  }, [])
  return { me: snap.me, ready: cached !== null }
}

/** Initial greeting letter for the avatar chip (works for Devanagari names too). */
export function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed[0]!.toUpperCase() : '?'
}
