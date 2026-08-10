/**
 * Apply versioned operational SQL migrations against DATABASE_URL.
 * Usage: pnpm --filter @nagarikwatch/web migrate:ops
 */
import {
  applyPendingOpsMigrationsWithClient,
  getOpsMigrationStatusWithClient,
  loadOpsMigrationEnv,
  withCliMigrationClient,
} from '../lib/ops-migrations-runner'

async function main() {
  await loadOpsMigrationEnv()
  await withCliMigrationClient(async (client) => {
    const before = await getOpsMigrationStatusWithClient(client)
    console.log(`[migrate:ops] storage=${before.storage}`)
    console.log(`[migrate:ops] applied=${before.applied.length} pending=${before.pending.length}`)
    if (before.pending.length) {
      console.log(`[migrate:ops] pending: ${before.pending.join(', ')}`)
    }
    const result = await applyPendingOpsMigrationsWithClient(client)
    console.log(`[migrate:ops] newly applied: ${result.applied.join(', ') || '(none)'}`)
    const after = await getOpsMigrationStatusWithClient(client)
    console.log(
      `[migrate:ops] done. applied=${after.applied.length} pending=${after.pending.length}`,
    )
  })
}

main().catch((error) => {
  const message =
    error instanceof Error
      ? error.message || error.stack || String(error)
      : typeof error === 'string'
        ? error
        : JSON.stringify(error)
  console.error('[migrate:ops] failed:', message || 'unknown error (is DATABASE_URL set?)')
  process.exitCode = 1
})
