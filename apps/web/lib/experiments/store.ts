import 'server-only'
import { createHmac } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'
import { analyzeExperiment, assignVariant, type ExperimentAnalysis } from './core'
import { getExperimentDefinition, getExperimentDefinitions } from './definitions'

export type ExperimentEventType = 'exposure' | 'conversion'

type LocalEvent = {
  experimentId: string
  variantId: string
  visitorHash: string
  eventType: ExperimentEventType
  at: string
}

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'experiment-events.json')
const SCHEMA_KEY = 'nw-experiments-v1'
let localCache: LocalEvent[] | null = null
let localWrite = Promise.resolve()

async function ensureTable(pool: Queryable): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_experiment_events (
      id BIGSERIAL PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (experiment_id, visitor_hash, event_type)
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS nw_experiment_events_experiment_at_idx
     ON nw_experiment_events (experiment_id, created_at DESC)`,
  )
}

function hashSecret(): string {
  const configured =
    process.env.EXPERIMENT_HASH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.BETTER_AUTH_SECRET
  if (configured?.trim()) return configured
  if (isProductionRuntime()) {
    throw new Error('EXPERIMENT_HASH_SECRET or AUTH_SECRET is required in production.')
  }
  return 'nagarik-watch-local-experiment-secret'
}

export function hashExperimentVisitor(visitorKey: string): string {
  return createHmac('sha256', hashSecret()).update(visitorKey).digest('hex')
}

async function readLocal(): Promise<LocalEvent[]> {
  if (localCache) return localCache
  try {
    localCache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as LocalEvent[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    localCache = []
  }
  return localCache
}

async function writeLocal(events: LocalEvent[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(events.slice(-20_000)), 'utf8')
    localCache = events
  })
  await localWrite
}

export async function assignAndRecordExperiment(input: {
  experimentId: string
  visitorKey: string
  eventType: ExperimentEventType
}): Promise<{ variantId: string; recorded: boolean } | null> {
  const definition = getExperimentDefinition(input.experimentId)
  if (!definition || definition.status !== 'active') return null
  const visitorKey = input.visitorKey.trim().slice(0, 200)
  if (!visitorKey) return null
  const variant = assignVariant(definition.id, visitorKey, definition.variants)
  if (!variant) return null
  const visitorHash = hashExperimentVisitor(visitorKey)

  const pool = await ensureOperationalSchema(SCHEMA_KEY, ensureTable)
  if (pool) {
    const result = await pool.query(
      `INSERT INTO nw_experiment_events
        (experiment_id, variant_id, visitor_hash, event_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (experiment_id, visitor_hash, event_type) DO NOTHING`,
      [definition.id, variant.id, visitorHash, input.eventType],
    )
    return { variantId: variant.id, recorded: Boolean(result.rowCount) }
  }

  if (isProductionRuntime()) {
    throw new Error('Experiment event storage requires Postgres in production.')
  }
  const events = await readLocal()
  const exists = events.some(
    (event) =>
      event.experimentId === definition.id &&
      event.visitorHash === visitorHash &&
      event.eventType === input.eventType,
  )
  if (!exists) {
    events.push({
      experimentId: definition.id,
      variantId: variant.id,
      visitorHash,
      eventType: input.eventType,
      at: new Date().toISOString(),
    })
    await writeLocal(events)
  }
  return { variantId: variant.id, recorded: !exists }
}

async function observationsFor(experimentId: string) {
  const pool = await ensureOperationalSchema(SCHEMA_KEY, ensureTable)
  if (pool) {
    const result = await pool.query<{
      variant_id: string
      exposures: string | number
      conversions: string | number
    }>(
      `SELECT variant_id,
              COUNT(*) FILTER (WHERE event_type='exposure')::int AS exposures,
              COUNT(*) FILTER (WHERE event_type='conversion')::int AS conversions
       FROM nw_experiment_events
       WHERE experiment_id=$1
       GROUP BY variant_id`,
      [experimentId],
    )
    return result.rows.map((row) => ({
      variantId: row.variant_id,
      exposures: Number(row.exposures),
      conversions: Number(row.conversions),
    }))
  }
  const events = (await readLocal()).filter((event) => event.experimentId === experimentId)
  const byVariant = new Map<string, { variantId: string; exposures: number; conversions: number }>()
  for (const event of events) {
    const current = byVariant.get(event.variantId) ?? {
      variantId: event.variantId,
      exposures: 0,
      conversions: 0,
    }
    if (event.eventType === 'exposure') current.exposures += 1
    if (event.eventType === 'conversion') current.conversions += 1
    byVariant.set(event.variantId, current)
  }
  return [...byVariant.values()]
}

export async function listExperimentAnalyses(): Promise<
  Array<{
    definition: ReturnType<typeof getExperimentDefinitions>[number]
    analysis: ExperimentAnalysis
  }>
> {
  const definitions = getExperimentDefinitions()
  return Promise.all(
    definitions.map(async (definition) => ({
      definition,
      analysis: analyzeExperiment(definition, await observationsFor(definition.id)),
    })),
  )
}

