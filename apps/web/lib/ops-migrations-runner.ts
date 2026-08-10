/**
 * CLI-safe operational migration runner (no `server-only` imports).
 * Used by `pnpm migrate:ops` and by Next.js via ops-migrations.ts wrappers.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import {
  OPS_MIGRATIONS_TABLE_SQL,
  planOpsMigrations,
  type OpsMigration,
} from './ops-migrations-core'

export type MigrationQueryable = {
  query: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ rows: Array<Record<string, unknown>>; rowCount: number | null }>
}

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DEFAULT_MIGRATIONS_DIR = path.join(PACKAGE_ROOT, 'migrations')

function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL,
  ]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && /^postgres(?:ql)?:\/\//i.test(value)) return value
  }
  return undefined
}

function shouldRelaxSsl(url: string): boolean {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') return false
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') return true
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.endsWith('.aivencloud.com') || host.endsWith('.aiven.io')
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  if (!shouldRelaxSsl(url)) return url
  const question = url.indexOf('?')
  if (question < 0) return `${url}?sslmode=no-verify`
  const base = url.slice(0, question)
  const kept = url
    .slice(question + 1)
    .split('&')
    .filter((part) => {
      const key = part.split('=', 1)[0]?.toLowerCase()
      return key !== 'sslmode' && key !== 'ssl' && key !== 'uselibpqcompat'
    })
    .filter(Boolean)
  const join = kept.length ? `${base}?${kept.join('&')}&` : `${base}?`
  return `${join}sslmode=no-verify`
}

/** Load `.env` then `.env.local` from package root and monorepo root without dotenv. */
export async function loadOpsMigrationEnv(cwd = PACKAGE_ROOT): Promise<void> {
  const roots = [cwd, path.resolve(cwd, '../..')]
  for (const root of roots) {
    for (const name of ['.env', '.env.local']) {
      const file = path.join(root, name)
      try {
        const text = await fs.readFile(file, 'utf8')
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eq = trimmed.indexOf('=')
          if (eq <= 0) continue
          const key = trimmed.slice(0, eq).trim()
          if (!key || process.env[key] !== undefined) continue
          let val = trimmed.slice(eq + 1).trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          process.env[key] = val
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
  }
}

export async function loadMigrationFiles(
  dir = DEFAULT_MIGRATIONS_DIR,
): Promise<Array<{ filename: string; sql: string }>> {
  const entries = await fs.readdir(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [] as string[]
    throw error
  })
  const files = entries.filter((name) => name.endsWith('.sql')).sort()
  return Promise.all(
    files.map(async (filename) => ({
      filename,
      sql: await fs.readFile(path.join(dir, filename), 'utf8'),
    })),
  )
}

async function ensureMigrationsTable(client: MigrationQueryable): Promise<void> {
  await client.query(OPS_MIGRATIONS_TABLE_SQL)
}

async function listAppliedIds(client: MigrationQueryable): Promise<string[]> {
  await ensureMigrationsTable(client)
  const result = await client.query(`SELECT id FROM nw_ops_migrations ORDER BY id ASC`)
  return result.rows.map((row) => String(row.id))
}

async function applyOne(client: MigrationQueryable, migration: OpsMigration): Promise<void> {
  await client.query('BEGIN')
  try {
    await client.query(migration.sql)
    await client.query(
      `INSERT INTO nw_ops_migrations (id, filename) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [migration.id, migration.filename],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  }
}

export async function getOpsMigrationStatusWithClient(
  client: MigrationQueryable,
  directory = DEFAULT_MIGRATIONS_DIR,
): Promise<{ applied: string[]; pending: string[]; storage: 'postgres' }> {
  const files = await loadMigrationFiles(directory)
  const applied = await listAppliedIds(client)
  const { pending } = planOpsMigrations(files, applied)
  return {
    applied,
    pending: pending.map((item) => item.id),
    storage: 'postgres',
  }
}

export async function applyPendingOpsMigrationsWithClient(
  client: MigrationQueryable,
  directory = DEFAULT_MIGRATIONS_DIR,
): Promise<{ applied: string[]; pendingBefore: string[] }> {
  const files = await loadMigrationFiles(directory)
  const appliedIds = await listAppliedIds(client)
  const { pending } = planOpsMigrations(files, appliedIds)
  const applied: string[] = []
  for (const migration of pending) {
    await applyOne(client, migration)
    applied.push(migration.id)
  }
  return { applied, pendingBefore: pending.map((item) => item.id) }
}

/** Open a dedicated CLI pool, run work on one client, then close. */
export async function withCliMigrationClient<T>(
  fn: (client: MigrationQueryable) => Promise<T>,
): Promise<T> {
  const raw = resolveDatabaseUrl()
  if (!raw) {
    throw new Error('DATABASE_URL is required to apply operational migrations.')
  }
  const require = createRequire(import.meta.url)
  const { Pool } = require('pg') as typeof import('pg')
  const pool = new Pool({
    connectionString: normalizeUrl(raw),
    ssl: shouldRelaxSsl(raw) ? { rejectUnauthorized: false } : undefined,
    max: 1,
  })
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
    await pool.end().catch(() => undefined)
  }
}

export async function listPendingOpsMigrationIds(
  directory = DEFAULT_MIGRATIONS_DIR,
): Promise<string[]> {
  const files = await loadMigrationFiles(directory)
  const { pending } = planOpsMigrations(files, [])
  return pending.map((item) => item.id)
}
