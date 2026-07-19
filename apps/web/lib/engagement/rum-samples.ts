import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'

type RumSample = {
  name: string
  value: number
  path: string
  at: string
}

const SCHEMA_KEY = 'nw-rum-samples-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'rum-samples.json')
let localCache: RumSample[] | null = null
let localWrite: Promise<void> = Promise.resolve()

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
  if (localCache) return localCache
  try {
    localCache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf-8')) as RumSample[]
  } catch {
    localCache = []
  }
  return localCache
}

async function writeLocal(samples: RumSample[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(samples.slice(-5_000)), 'utf-8')
    localCache = samples
  })
  await localWrite
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
