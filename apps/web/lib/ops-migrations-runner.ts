/**
 * Operational migration runner (no `server-only` imports).
 * Used by `pnpm migrate:ops` and by Next.js via ops-migrations.ts wrappers.
 *
 * CLI-only concerns — dotenv-less `.env` loading and the dedicated `pg` pool —
 * live in `ops-migrations-cli.ts`. They used to sit here, which dragged a
 * `readFile(path.join(root, name))` over a computed root into the Next server
 * graph; Turbopack could not statically scope it and traced the whole project
 * into the serverless bundle.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

export async function listPendingOpsMigrationIds(
  directory = DEFAULT_MIGRATIONS_DIR,
): Promise<string[]> {
  const files = await loadMigrationFiles(directory)
  const { pending } = planOpsMigrations(files, [])
  return pending.map((item) => item.id)
}
