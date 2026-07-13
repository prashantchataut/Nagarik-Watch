import 'server-only'

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
  return process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'memory'
}

export async function getOperationalPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (operationalStorageMode() !== 'postgres') {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL must point to Postgres for production operational storage.')
    }
    return null
  }
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.NW_DB_POOL_MAX ?? 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }) as Queryable
    })()
  }
  return poolPromise
}

export async function ensureOperationalSchema(key: string, setup: (pool: Queryable) => Promise<void>) {
  const pool = await getOperationalPool()
  if (!pool) return null
  if (!readySchemas.has(key)) {
    readySchemas.set(key, setup(pool))
  }
  await readySchemas.get(key)
  return pool
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
