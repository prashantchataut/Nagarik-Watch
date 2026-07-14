import 'server-only'
import { postgresPoolConfig, resolveDatabaseUrl } from '@/lib/db-url'

export type QueryResult<T extends Record<string, unknown>> = {
  rows: T[]
  rowCount: number | null
}

export type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>
}

let poolPromise: Promise<Queryable | null> | null = null
const readySchemas = new Map<string, Promise<void>>()

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'
}

export function operationalStorageMode(): 'postgres' | 'memory' {
  return resolveDatabaseUrl() ? 'postgres' : 'memory'
}

export async function getOperationalPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (operationalStorageMode() !== 'postgres') {
    if (isProductionRuntime()) {
      // Public pages (polls, nav session, etc.) must stay up even when the
      // operator has not provisioned Postgres yet. Callers fall back to local
      // files / empty results; auth still refuses ephemeral production DBs.
      console.error('[ops-db] DATABASE_URL is missing in production; operational features use local fallbacks.')
    }
    return null
  }
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      const config = postgresPoolConfig()
      if (!config) return null
      return new Pool(config) as Queryable
    })().catch((error) => {
      poolPromise = null
      throw error
    })
  }
  try {
    return await poolPromise
  } catch (error) {
    console.error('[ops-db] could not create Postgres pool', error instanceof Error ? error.message : error)
    return null
  }
}

export async function ensureOperationalSchema(key: string, setup: (pool: Queryable) => Promise<void>) {
  try {
    const pool = await getOperationalPool()
    if (!pool) return null
    if (!readySchemas.has(key)) {
      readySchemas.set(
        key,
        setup(pool).catch((error) => {
          readySchemas.delete(key)
          throw error
        }),
      )
    }
    await readySchemas.get(key)
    return pool
  } catch (error) {
    // DNS / TLS / connection failures (e.g. deleted Aiven host) must not crash
    // Server Components that only need optional operational data.
    console.error(
      `[ops-db] schema "${key}" unavailable`,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function cleanText(value: unknown, max = 500): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function cleanMultiline(value: unknown, max = 5000): string {
  return String(value ?? '').replace(/\r\n/g, '\n').trim().slice(0, max)
}

export function asSlug(value: unknown, fallback = 'item'): string {
  const raw = String(value ?? '').toLowerCase().trim()
  const slug = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0900-\u097f]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
  return slug || `${fallback}-${Date.now().toString(36)}`
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}
