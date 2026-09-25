/**
 * Records the last-run timestamp for scheduled/cron jobs so ops health
 * reporting can detect missed runs honestly. Same DB/local-file fallback
 * shape as `lib/engagement/ranking-events.ts`.
 */
import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { processState } from '@/lib/runtime/process-singleton'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'

/**
 * Module scope is not process scope. Next emits this file into both the RSC/SSR
 * graph and the route-handler graph, so a plain `let` here is one cache and one
 * write queue per layer -- which is two locks, and two locks are no lock: a
 * concurrent read-modify-write on the same JSON file interleaves and drops one
 * of the writes. `processState` keys off `globalThis`, the only scope both
 * layers share. See lib/runtime/process-singleton.ts for the evidence.
 */
const local = processState('cron-heartbeat:local', () => ({
  cache: null as Record<string, string> | null,
  write: Promise.resolve() as Promise<void>,
}))

export type CronHeartbeat = { job: string; lastRunAt: string }

const SCHEMA_KEY = 'nw-cron-heartbeats-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'cron-heartbeats.json')

async function ensureTable(pool: Queryable): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_cron_heartbeats (
      job TEXT PRIMARY KEY,
      last_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

async function getPool(): Promise<Queryable | null> {
  return ensureOperationalSchema(SCHEMA_KEY, ensureTable)
}

async function readLocal(): Promise<Record<string, string>> {
  if (local.cache) return local.cache
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8')
    local.cache = JSON.parse(raw) as Record<string, string>
  } catch {
    local.cache = {}
  }
  return local.cache
}

async function writeLocal(entries: Record<string, string>): Promise<void> {
  local.write = local.write.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(entries), 'utf-8')
    local.cache = entries
  })
  await local.write
}

export async function recordCronHeartbeat(job: string): Promise<void> {
  const key = job.trim()
  if (!key) return
  const pool = await getPool()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_cron_heartbeats (job, last_run_at) VALUES ($1, NOW())
       ON CONFLICT (job) DO UPDATE SET last_run_at = NOW()`,
      [key],
    )
    await pool
      .query(`INSERT INTO nw_cron_run_history (job, run_at) VALUES ($1, NOW())`, [key])
      .catch((error) => {
        console.error(
          '[cron-heartbeat] history insert skipped',
          error instanceof Error ? error.message : error,
        )
      })
    await pool
      .query(`DELETE FROM nw_cron_run_history WHERE run_at < NOW() - INTERVAL '7 days'`)
      .catch(() => undefined)
    return
  }
  if (isProductionRuntime()) {
    console.error('[cron-heartbeat] DATABASE_URL missing; heartbeat dropped')
    return
  }
  const entries = await readLocal()
  entries[key] = new Date().toISOString()
  await writeLocal(entries)
}

export async function getCronHeartbeats(): Promise<CronHeartbeat[]> {
  const pool = await getPool()
  if (pool) {
    const result = await pool.query<{ job: string; last_run_at: string | Date }>(
      `SELECT job, last_run_at FROM nw_cron_heartbeats`,
    )
    return result.rows.map((row) => ({
      job: row.job,
      lastRunAt: new Date(row.last_run_at).toISOString(),
    }))
  }
  const entries = await readLocal()
  return Object.entries(entries).map(([job, lastRunAt]) => ({ job, lastRunAt }))
}

export async function getCronRunHistory(job: string): Promise<string[]> {
  const key = job.trim()
  if (!key) return []
  const pool = await getPool()
  if (!pool) return []
  try {
    const result = await pool.query<{ run_at: string | Date }>(
      `SELECT run_at FROM nw_cron_run_history WHERE job = $1 ORDER BY run_at DESC LIMIT 2000`,
      [key],
    )
    return result.rows.map((row) => new Date(row.run_at).toISOString())
  } catch {
    return []
  }
}

/** Minutes since a job's last recorded heartbeat, or null if it has never run. */
export function minutesSince(
  heartbeat: CronHeartbeat | undefined,
  now: Date = new Date(),
): number | null {
  if (!heartbeat) return null
  return Math.max(0, (now.getTime() - Date.parse(heartbeat.lastRunAt)) / 60_000)
}
