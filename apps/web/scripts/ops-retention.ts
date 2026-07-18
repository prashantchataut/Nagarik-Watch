/**
 * Report or delete expired operational analytics rows.
 * Dry-run is the default; pass --execute to commit deletions.
 */
import { loadOpsMigrationEnv, withCliMigrationClient } from '../lib/ops-migrations-runner'

type RetentionTarget = {
  table: string
  timestamp: string
  env: string
  defaultDays: number
}

const TARGETS: RetentionTarget[] = [
  {
    table: 'nw_ranking_events',
    timestamp: 'created_at',
    env: 'RETENTION_RANKING_DAYS',
    defaultDays: 90,
  },
  {
    table: 'nw_search_events',
    timestamp: 'created_at',
    env: 'RETENTION_SEARCH_DAYS',
    defaultDays: 90,
  },
  {
    table: 'nw_experiment_events',
    timestamp: 'created_at',
    env: 'RETENTION_EXPERIMENT_DAYS',
    defaultDays: 180,
  },
  { table: 'nw_ad_events', timestamp: 'created_at', env: 'RETENTION_AD_DAYS', defaultDays: 180 },
  {
    table: 'nw_rate_limits',
    timestamp: 'reset_at',
    env: 'RETENTION_RATE_LIMIT_DAYS',
    defaultDays: 7,
  },
]

function ttlDays(target: RetentionTarget): number {
  const value = Number.parseInt(process.env[target.env] ?? '', 10)
  return Number.isFinite(value) && value > 0 ? value : target.defaultDays
}

async function main() {
  await loadOpsMigrationEnv()
  const execute = process.argv.includes('--execute')

  await withCliMigrationClient(async (client) => {
    console.log(`[ops-retention] mode=${execute ? 'execute' : 'dry-run'}`)
    for (const target of TARGETS) {
      const exists = await client.query('SELECT to_regclass($1) AS name', [target.table])
      if (!exists.rows[0]?.name) {
        console.log(`[ops-retention] ${target.table}: table absent, skipped`)
        continue
      }

      const days = ttlDays(target)
      const action = execute ? 'DELETE' : 'SELECT'
      const projection = execute ? '' : 'count(*)::int AS count FROM'
      const returning = execute ? ' RETURNING 1' : ''
      const result = await client.query(
        `${action} ${projection} ${target.table}
         WHERE ${target.timestamp} < now() - ($1 * interval '1 day')${returning}`,
        [days],
      )
      const count = execute ? (result.rowCount ?? 0) : Number(result.rows[0]?.count ?? 0)
      console.log(
        `[ops-retention] ${target.table}: ${count} row(s) ${execute ? 'deleted' : 'eligible'}; ttl=${days}d`,
      )
    }
  })
}

main().catch((error) => {
  console.error('[ops-retention] failed', error instanceof Error ? error.message : error)
  process.exitCode = 1
})
