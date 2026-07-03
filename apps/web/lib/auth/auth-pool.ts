/**
 * Database dialect for Better Auth. Picks the right Kysely dialect at runtime:
 *   - DATABASE_URL present → PostgresDialect (production, shared with Payload).
 *   - absent → PGliteDialect (in-memory Postgres via WASM). Survives for the
 *     life of the server process; resets on restart. Perfect for dev/preview
 *     and for the seed-backed demo where reader accounts are ephemeral.
 *
 * Both dialects speak real SQL, so Better Auth's schema creation + queries
 * work identically. No code branches on the auth layer.
 */
import 'server-only'
import { PostgresDialect, PGliteDialect } from 'kysely'
import type { Dialect } from 'kysely'

let cached: Dialect | null = null

export async function createDialect(): Promise<Dialect> {
  if (cached) return cached

  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && dbUrl.startsWith('postgres')) {
    const { Pool } = await import('pg')
    cached = new PostgresDialect({
      pool: new Pool({
        connectionString: dbUrl,
        max: 5,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }),
    })
  } else {
    // PGlite runs Postgres in-process via WASM. The instance is lazy and
    // shared; Better Auth creates its tables on first request.
    const { PGlite } = await import('@electric-sql/pglite')
    const pglite = await PGlite.create()
    cached = new PGliteDialect({ pglite })
  }
  return cached
}
