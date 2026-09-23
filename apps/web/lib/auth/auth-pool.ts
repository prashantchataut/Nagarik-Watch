import 'server-only'
import { PostgresDialect, PGliteDialect } from 'kysely'
import type { Dialect } from 'kysely'
import { getSharedPool } from '@/lib/pg-pool'
import { resolveDatabaseUrl } from '@/lib/db-url'
import { dataPath } from '@/lib/fs/data-path'
import { processSingleton } from '@/lib/runtime/process-singleton'

/**
 * The dialect and the raw PGlite handle are built together and cached together.
 * `getAuthPgliteQueryable` used to read a separate module-level `cachedPglite`,
 * which made it possible for the two to drift apart; keeping them in one record
 * behind one key removes the question.
 */
type AuthBackend = {
  dialect: Dialect
  /** Non-null only when auth is running on PGlite (no DATABASE_URL). */
  pglite: import('@electric-sql/pglite').PGlite | null
}

/**
 * Process-scoped, not module-scoped -- see `lib/runtime/process-singleton.ts`.
 * Next emits this file into both the RSC/SSR graph and the route-handler graph,
 * so a module-level cache here produced two PGlite instances on one data
 * directory and writes made through one were invisible to the other.
 */
const BACKEND_KEY = 'auth:dialect'

function pgliteDataDir(): string {
  return dataPath(process.env.PGLITE_DATA_DIR, 'auth-pglite')
}

async function buildBackend(): Promise<AuthBackend> {
  const isolatedReaderE2e = process.env.E2E_TEST === 'true' && process.env.E2E_NEWSROOM !== 'true'
  if (process.env.NEXT_PHASE === 'phase-production-build' || isolatedReaderE2e) {
    const { PGlite } = await import('@electric-sql/pglite')
    // Argument-less create() is an in-memory DB. Avoid "memory://" — on some
    // Windows/Node combinations PGlite turns that into a URL object and crashes.
    const pglite = await PGlite.create()
    return { dialect: new PGliteDialect({ pglite }), pglite }
  }

  if (resolveDatabaseUrl()) {
    const pool = await getSharedPool()
    if (!pool) {
      throw new Error('DATABASE_URL is set but the shared Postgres pool could not be created.')
    }
    return { dialect: new PostgresDialect({ pool }), pglite: null }
  }

  const allowPgliteInProduction =
    process.env.E2E_NEWSROOM === 'true' || process.env.ALLOW_PGLITE_AUTH === 'true'
  if (process.env.NODE_ENV === 'production' && !allowPgliteInProduction) {
    throw new Error('DATABASE_URL is required for authentication in production.')
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const pglite = await PGlite.create(pgliteDataDir())
  return { dialect: new PGliteDialect({ pglite }), pglite }
}

function backend(): Promise<AuthBackend> {
  return processSingleton(BACKEND_KEY, buildBackend)
}

export async function createDialect(): Promise<Dialect> {
  return (await backend()).dialect
}

/** Raw SQL access for boot provisioning when Postgres is not configured. */
export async function getAuthPgliteQueryable(): Promise<{
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>
} | null> {
  if (resolveDatabaseUrl()) return null
  const { pglite } = await backend()
  if (!pglite) return null
  return {
    query: async <T extends Record<string, unknown> = Record<string, unknown>>(
      text: string,
      params: unknown[] = [],
    ) => {
      const result = await pglite.query(text, params)
      const rows = result.rows as T[]
      const affected = typeof result.affectedRows === 'number' ? result.affectedRows : rows.length
      return { rows, rowCount: affected }
    },
  }
}
