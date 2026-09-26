import 'server-only'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { processState } from '@/lib/runtime/process-singleton'
import { getSharedPool } from '@/lib/pg-pool'
import { dataPath } from '@/lib/fs/data-path'

/**
 * Module scope is not process scope. Next emits this file into both the RSC/SSR
 * graph and the route-handler graph, so a plain `let` here is one cache and one
 * write queue per layer -- which is two locks, and two locks are no lock: a
 * concurrent read-modify-write on the same JSON file interleaves and drops one
 * of the writes. `processState` keys off `globalThis`, the only scope both
 * layers share. See lib/runtime/process-singleton.ts for the evidence.
 */
const local = processState('live-manual:local', () => ({
  schemaReady: null as Promise<void> | null,
  writeQueue: Promise.resolve() as Promise<void>,
  readDegradationLogged: false as boolean,
}))

export type ManualLiveRecord<T = unknown> = {
  key: string
  source: string
  data: T
  updatedAt: string
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type Row = { key: string; source: string; data: unknown; updated_at: Date | string }
type LocalStore = Record<string, ManualLiveRecord>

const LOCAL_STORE_PATH = dataPath(process.env.LIVE_MANUAL_STORE_PATH, 'live-manual.json')

function isProductionRuntime(): boolean {
  const isolatedE2e = process.env.E2E_TEST === 'true' || process.env.E2E_NEWSROOM === 'true'
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    !isolatedE2e
  )
}

/**
 * Live-data overrides are newsroom chrome — weather, AQI, forex, scores, alerts —
 * not article content, so reads and writes get deliberately different failure
 * modes.
 *
 * A write that cannot reach Postgres must throw. An editor who saves an override
 * has to know it did not persist, and the local JSON store below is a development
 * affordance on an ephemeral filesystem, not somewhere a production write may
 * quietly land.
 *
 * A read must not throw. Every read here answers "has the newsroom pinned a value
 * for this key?", and "no" is an ordinary answer that every caller already
 * handles. Throwing instead took the entire site down: these reads sit behind the
 * masthead weather/AQI strip, so an unset or briefly unreachable DATABASE_URL made
 * the server render throw *after* the shell had already flushed, and the client
 * error boundary replaced every page — homepage included — with
 * "पृष्ठ लोड हुन सकेन". Chrome that fails has to degrade to absent, never take the
 * page down with it.
 */
type PoolMode = 'read' | 'write'

async function getPool(mode: PoolMode): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  const pool = await getSharedPool()
  if (!pool) {
    if (mode === 'write' && isProductionRuntime()) {
      throw new Error('DATABASE_URL is required for persistent live-data overrides in production')
    }
    return null
  }
  return pool as unknown as Queryable
}

async function ensureSchema(mode: PoolMode): Promise<Queryable | null> {
  const pool = await getPool(mode)
  if (!pool) return null
  if (!local.schemaReady) {
    local.schemaReady = pool
      .query(
        `
        CREATE TABLE IF NOT EXISTS nw_live_manual (
          key text PRIMARY KEY,
          source text NOT NULL,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `,
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        // Clear the cache before rethrowing. `local.schemaReady` is memoised for the
        // process, so holding on to a rejected promise would make one transient
        // DDL failure permanent — every later call, writes included, would reject
        // with the original error and never retry.
        local.schemaReady = null
        throw error
      })
  }
  await local.schemaReady
  return pool
}

/**
 * Read-side pool. Swallows *every* failure, not just an absent DATABASE_URL:
 * `ensureSchema` issues a CREATE TABLE IF NOT EXISTS, so a reachable database
 * whose role lacks DDL rights, or a connection that drops mid-request, would
 * otherwise throw from the same place an unset DATABASE_URL used to and take the
 * page down in exactly the same way. Callers treat `null` as "no override
 * pinned", which is the safe reading in all of those cases.
 *
 * Logged once per process rather than per request: the masthead reads several
 * keys on every page, so per-request logging would bury the signal it exists to
 * provide.
 */
async function readPool(): Promise<Queryable | null> {
  try {
    return await ensureSchema('read')
  } catch (error) {
    if (!local.readDegradationLogged) {
      local.readDegradationLogged = true
      console.warn(
        '[live-manual] override store unreachable; serving live widgets without newsroom overrides:',
        (error as Error).message,
      )
    }
    return null
  }
}

function rowToRecord<T>(row: Row): ManualLiveRecord<T> {
  return {
    key: row.key,
    source: row.source,
    data: row.data as T,
    updatedAt:
      row.updated_at instanceof Date
        ? row.updated_at.toISOString()
        : new Date(row.updated_at).toISOString(),
  }
}

async function readLocalStore(): Promise<LocalStore> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return {}
  try {
    const raw = await readFile(LOCAL_STORE_PATH, 'utf8')
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as LocalStore)
      : {}
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw new Error(`Unable to read local live-data store: ${(error as Error).message}`)
  }
}

async function writeLocalStore(store: LocalStore): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
  const temporaryPath = `${LOCAL_STORE_PATH}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, LOCAL_STORE_PATH)
}

export async function getManualLiveRecord<T>(key: string): Promise<ManualLiveRecord<T> | null> {
  const pool = await readPool()
  if (pool) {
    const result = await pool.query<Row>('SELECT * FROM nw_live_manual WHERE key = $1', [key])
    return result.rows[0] ? rowToRecord<T>(result.rows[0]) : null
  }
  if (isProductionRuntime()) return null
  const store = await readLocalStore()
  return (store[key] as ManualLiveRecord<T> | undefined) ?? null
}

export async function listManualLiveRecords(): Promise<ManualLiveRecord[]> {
  const pool = await readPool()
  if (pool) {
    const result = await pool.query<Row>('SELECT * FROM nw_live_manual ORDER BY updated_at DESC')
    return result.rows.map(rowToRecord)
  }
  if (isProductionRuntime()) return []
  return Object.values(await readLocalStore()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
}

export async function setManualLiveRecord(input: {
  key: string
  source?: string
  data: unknown
}): Promise<ManualLiveRecord> {
  const record: ManualLiveRecord = {
    key: input.key.trim().slice(0, 80),
    source: (input.source?.trim() || 'Newsroom manual update').slice(0, 160),
    data: input.data,
    updatedAt: new Date().toISOString(),
  }
  if (!record.key) throw new Error('A live-data key is required')

  const pool = await ensureSchema('write')
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_live_manual (key, source, data)
       VALUES ($1,$2,$3::jsonb)
       ON CONFLICT (key) DO UPDATE
       SET source = EXCLUDED.source, data = EXCLUDED.data, updated_at = now()
       RETURNING *`,
      [record.key, record.source, JSON.stringify(record.data)],
    )
    const saved = result.rows[0]
    if (!saved) throw new Error('Live-data override was not persisted')
    return rowToRecord(saved)
  }

  local.writeQueue = local.writeQueue.then(async () => {
    const store = await readLocalStore()
    store[record.key] = record
    await writeLocalStore(store)
  })
  await local.writeQueue
  return record
}
