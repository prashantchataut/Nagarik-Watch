import 'server-only'
import { resolveDatabaseUrl } from '@/lib/db-url'
import { getSharedPool } from '@/lib/pg-pool'

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

const readySchemas = new Map<string, Promise<void>>()

export function isProductionRuntime(): boolean {
  const isolatedE2e = process.env.E2E_TEST === 'true'
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    !isolatedE2e
  )
}

export function operationalStorageMode(): 'postgres' | 'memory' {
  return resolveDatabaseUrl() ? 'postgres' : 'memory'
}

export async function getOperationalPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (operationalStorageMode() !== 'postgres') {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL must point to Postgres for production operational storage.')
    }
    return null
  }
  try {
    const pool = await getSharedPool()
    return pool as Queryable | null
  } catch (error) {
    console.error(
      '[ops-db] could not acquire shared Postgres pool',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export function requireOperationalPool(pool: Queryable | null): Queryable | null {
  if (!pool && isProductionRuntime()) {
    throw new Error('Postgres is required for production operational storage.')
  }
  return pool
}

export async function ensureOperationalSchema(
  key: string,
  setup: (pool: Queryable) => Promise<void>,
) {
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
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export function cleanMultiline(value: unknown, max = 5000): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, max)
}

export function asSlug(value: unknown, fallback = 'item'): string {
  const raw = String(value ?? '')
    .toLowerCase()
    .trim()
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
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
