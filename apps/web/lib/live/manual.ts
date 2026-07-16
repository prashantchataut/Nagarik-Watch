import 'server-only'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { getSharedPool } from '@/lib/pg-pool'

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

const LOCAL_STORE_PATH =
  process.env.LIVE_MANUAL_STORE_PATH ?? path.join(process.cwd(), '.data', 'live-manual.json')
let schemaReady: Promise<void> | null = null
let localWriteQueue = Promise.resolve()

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'
}

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  const pool = await getSharedPool()
  if (!pool) {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL is required for persistent live-data overrides in production')
    }
    return null
  }
  return pool as unknown as Queryable
}

async function ensureSchema(): Promise<Queryable | null> {
  const pool = await getPool()
  if (!pool) return null
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS nw_live_manual (
          key text PRIMARY KEY,
          source text NOT NULL,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      .then(() => undefined)
  }
  await schemaReady
  return pool
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
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>('SELECT * FROM nw_live_manual WHERE key = $1', [key])
    return result.rows[0] ? rowToRecord<T>(result.rows[0]) : null
  }
  const store = await readLocalStore()
  return (store[key] as ManualLiveRecord<T> | undefined) ?? null
}

export async function listManualLiveRecords(): Promise<ManualLiveRecord[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>('SELECT * FROM nw_live_manual ORDER BY updated_at DESC')
    return result.rows.map(rowToRecord)
  }
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

  const pool = await ensureSchema()
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

  localWriteQueue = localWriteQueue.then(async () => {
    const store = await readLocalStore()
    store[record.key] = record
    await writeLocalStore(store)
  })
  await localWriteQueue
  return record
}
