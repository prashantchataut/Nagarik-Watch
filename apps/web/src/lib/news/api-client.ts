'use client'

/**
 * Typed API client — one place for fetch + error normalisation.
 * All app calls to /api/* go through this (except auth-store's own POSTs).
 */

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ?? `सर्भर त्रुटि (${res.status})।`
    throw new ApiError(message, res.status)
  }
  return json as T
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>(url, { cache: 'no-store' })
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) })
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
}

export function apiDelete<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'DELETE' })
}
