import 'server-only'
import path from 'node:path'
import { PostgresDialect, PGliteDialect } from 'kysely'
import type { Dialect } from 'kysely'
import { resolveDatabaseUrl } from '@/lib/db-url'

let cached: Dialect | null = null

function pgliteDataDir(): string {
  const configured = process.env.PGLITE_DATA_DIR?.trim()
  const value = configured || path.join(process.cwd(), '.data', 'auth-pglite')
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)
}

export async function createDialect(): Promise<Dialect> {
  if (cached) return cached

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    const { PGlite } = await import('@electric-sql/pglite')
    cached = new PGliteDialect({ pglite: await PGlite.create('memory://') })
    return cached
  }

  const dbUrl = resolveDatabaseUrl()
  if (dbUrl) {
    const { Pool } = await import('pg')
    cached = new PostgresDialect({
      pool: new Pool({
        connectionString: dbUrl,
        max: Number(process.env.NW_DB_POOL_MAX || 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    })
    return cached
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required for authentication in production.')
  }

  const { PGlite } = await import('@electric-sql/pglite')
  cached = new PGliteDialect({ pglite: await PGlite.create(pgliteDataDir()) })
  return cached
}
