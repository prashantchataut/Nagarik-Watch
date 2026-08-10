import 'server-only'
import path from 'node:path'
import { PostgresDialect, PGliteDialect } from 'kysely'
import type { Dialect } from 'kysely'
import { getSharedPool } from '@/lib/pg-pool'
import { resolveDatabaseUrl } from '@/lib/db-url'

let cached: Dialect | null = null
let cachedPglite: import('@electric-sql/pglite').PGlite | null = null

function pgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR?.trim()
  const value = configured || path.join(process.cwd(), '.data', 'auth-pglite')
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)
}

export async function createDialect(): Promise<Dialect> {
  if (cached) return cached

  const isolatedReaderE2e = process.env.E2E_TEST === 'true' && process.env.E2E_NEWSROOM !== 'true'
  if (process.env.NEXT_PHASE === 'phase-production-build' || isolatedReaderE2e) {
    const { PGlite } = await import('@electric-sql/pglite')
    // Argument-less create() is an in-memory DB. Avoid "memory://" — on some
    // Windows/Node combinations PGlite turns that into a URL object and crashes.
    cached = new PGliteDialect({ pglite: await PGlite.create() })
    return cached
  }

  if (resolveDatabaseUrl()) {
    const pool = await getSharedPool()
    if (!pool) {
      throw new Error('DATABASE_URL is set but the shared Postgres pool could not be created.')
    }
    cached = new PostgresDialect({ pool })
    return cached
  }

  const allowPgliteInProduction =
    process.env.E2E_NEWSROOM === 'true' || process.env.ALLOW_PGLITE_AUTH === 'true'
  if (process.env.NODE_ENV === 'production' && !allowPgliteInProduction) {
    throw new Error('DATABASE_URL is required for authentication in production.')
  }

  const { PGlite } = await import('@electric-sql/pglite')
  cachedPglite = await PGlite.create(pgliteDataDir())
  cached = new PGliteDialect({ pglite: cachedPglite })
  return cached
}

/** Raw SQL access for boot provisioning when Postgres is not configured. */
export async function getAuthPgliteQueryable(): Promise<{
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>
} | null> {
  if (resolveDatabaseUrl()) return null
  await createDialect()
  if (!cachedPglite) return null
  return {
    query: async <T extends Record<string, unknown> = Record<string, unknown>>(
      text: string,
      params: unknown[] = [],
    ) => {
      const result = await cachedPglite!.query(text, params)
      const rows = result.rows as T[]
      const affected = typeof result.affectedRows === 'number' ? result.affectedRows : rows.length
      return { rows, rowCount: affected }
    },
  }
}
