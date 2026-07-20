/**
 * Truncate operational newsroom tables for deterministic local/E2E tests.
 * Never run against production.
 */
import { getSharedPoolOrThrow, closeSharedPool } from '../lib/pg-pool'

const TABLES = [
  'nw_journalist_draft_revisions',
  'nw_journalist_draft_meta',
  'nw_media_items',
  'nw_articles',
  'nw_audit_events',
]

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_RESET !== 'true') {
    throw new Error('Refusing to reset operational tables in production.')
  }
  const pool = await getSharedPoolOrThrow()
  for (const table of TABLES) {
    await pool.query(`DELETE FROM ${table}`)
    console.info(`[reset-test-data] cleared ${table}`)
  }
  await closeSharedPool()
}

main().catch((error) => {
  console.error('[reset-test-data] failed', error)
  process.exit(1)
})
