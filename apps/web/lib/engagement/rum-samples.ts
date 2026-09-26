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
const local = processState('engagement-rum-samples:local', () => ({
  cache: null as RumSample[] | null,
  write: Promise.resolve() as Promise<void>,
}))

type RumSample = {
  name: string
  value: number
  path: string
  at: string
}

const SCHEMA_KEY = 'nw-rum-samples-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'rum-samples.json')

async function ensureTable(pool: Queryable): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_rum_samples (
      id bigserial PRIMARY KEY,
      metric_name text NOT NULL,
      metric_value double precision NOT NULL,
      path text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
}

async function getPool(): Promise<Queryable | null> {
  return ensureOperationalSchema(SCHEMA_KEY, ensureTable)
}

async function readLocal(): Promise<RumSample[]> {
  if (local.cache) return local.cache
  try {
    local.cache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf-8')) as RumSample[]
  } catch {
    local.cache = []
  }
  return local.cache
}

async function writeLocal(samples: RumSample[]): Promise<void> {
  local.write = local.write.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(samples.slice(-5_000)), 'utf-8')
    local.cache = samples
  })
  await local.write
}

export async function recordRumSample(input: {
  name: string
  value: number
  path: string
}): Promise<void> {
  const pool = await getPool()
  if (pool) {
    await pool.query(
      `INSERT INTO nw_rum_samples (metric_name, metric_value, path) VALUES ($1, $2, $3)`,
      [input.name, input.value, input.path],
    )
    return
  }
  if (isProductionRuntime()) {
    console.error('[rum] DATABASE_URL missing; sample dropped')
    return
  }
  const samples = await readLocal()
  samples.push({
    name: input.name,
    value: input.value,
    path: input.path,
    at: new Date().toISOString(),
  })
  await writeLocal(samples)
}
