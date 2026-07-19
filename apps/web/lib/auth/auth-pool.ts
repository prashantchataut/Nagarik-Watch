import 'server-only'
import path from 'node:path'
import { PostgresDialect, PGliteDialect } from 'kysely'
import type { Dialect } from 'kysely'
import { getSharedPool } from '@/lib/pg-pool'
import { resolveDatabaseUrl } from '@/lib/db-url'

let cached: Dialect | null = null

function pgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR?.trim()
  const value = configured || path.join(process.cwd(), '.data', 'auth-pglite')
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)
}

export async function createDialect(): Promise<Dialect> {
  if (cached) return cached

  const isolatedE2e = process.env.E2E_TEST === 'true'
  if (process.env.NEXT_PHASE === 'phase-production-build' || isolatedE2e) {
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

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required for authentication in production.')
  }

  const { PGlite } = await import('@electric-sql/pglite')
  cached = new PGliteDialect({ pglite: await PGlite.create(pgliteDataDir()) })
  return cached
}
