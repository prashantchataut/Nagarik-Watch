import 'server-only'
import { getOperationalPool, isProductionRuntime } from '@/lib/ops-db'
import { withSharedClient } from '@/lib/pg-pool'
import {
  DEFAULT_MIGRATIONS_DIR,
  applyPendingOpsMigrationsWithClient,
  getOpsMigrationStatusWithClient,
  loadMigrationFiles,
} from '@/lib/ops-migrations-runner'
import { planOpsMigrations } from '@/lib/ops-migrations-core'

export { DEFAULT_MIGRATIONS_DIR, listPendingOpsMigrationIds } from '@/lib/ops-migrations-runner'

export async function applyPendingOpsMigrations(options?: {
  directory?: string
}): Promise<{ applied: string[]; pendingBefore: string[] }> {
  const directory = options?.directory ?? DEFAULT_MIGRATIONS_DIR
  const pool = await getOperationalPool()
  if (!pool) {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL is required to apply operational migrations in production.')
    }
    return { applied: [], pendingBefore: [] }
  }

  return withSharedClient((client) => applyPendingOpsMigrationsWithClient(client, directory))
}

export async function getOpsMigrationStatus(directory?: string): Promise<{
  applied: string[]
  pending: string[]
  storage: 'postgres' | 'unavailable'
}> {
  const dir = directory ?? DEFAULT_MIGRATIONS_DIR
  const pool = await getOperationalPool()
  if (!pool) {
    const files = await loadMigrationFiles(dir)
    const { pending } = planOpsMigrations(files, [])
    return {
      applied: [],
      pending: pending.map((item) => item.id),
      storage: 'unavailable',
    }
  }

  return withSharedClient((client) => getOpsMigrationStatusWithClient(client, dir))
}

/** Sync-friendly check used when a live DB probe is unavailable (file inventory only). */
export async function getDeclaredOpsMigrationIds(): Promise<string[]> {
  const files = await loadMigrationFiles(DEFAULT_MIGRATIONS_DIR)
  return planOpsMigrations(files, []).migrations.map((item) => item.id)
}
