import 'server-only'

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

const memory = new Map<string, ManualLiveRecord>()
let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (!process.env.DATABASE_URL?.startsWith('postgres')) return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) as Queryable
    })()
  }
  return poolPromise
}

async function ensureSchema(): Promise<Queryable | null> {
  const pool = await getPool()
  if (!pool) return null
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_live_manual (
          key text PRIMARY KEY,
          source text NOT NULL,
          data jsonb NOT NULL,
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
    })()
  }
  await schemaReady
  return pool
}

function rowToRecord<T>(row: Row): ManualLiveRecord<T> {
  return {
    key: row.key,
    source: row.source,
    data: row.data as T,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  }
}

export async function getManualLiveRecord<T>(key: string): Promise<ManualLiveRecord<T> | null> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_live_manual WHERE key = $1`, [key])
    return result.rows[0] ? rowToRecord<T>(result.rows[0]) : null
  }
  return (memory.get(key) as ManualLiveRecord<T> | undefined) ?? null
}

export async function listManualLiveRecords(): Promise<ManualLiveRecord[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_live_manual ORDER BY updated_at DESC`)
    return result.rows.map(rowToRecord)
  }
  return Array.from(memory.values()).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
}

export async function setManualLiveRecord(input: {
  key: string
  source?: string
  data: unknown
}): Promise<ManualLiveRecord> {
  const record: ManualLiveRecord = {
    key: input.key.slice(0, 80),
    source: (input.source?.trim() || 'Newsroom manual update').slice(0, 160),
    data: input.data,
    updatedAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_live_manual (key, source, data)
       VALUES ($1,$2,$3::jsonb)
       ON CONFLICT (key) DO UPDATE SET source = EXCLUDED.source, data = EXCLUDED.data, updated_at = now()
       RETURNING *`,
      [record.key, record.source, JSON.stringify(record.data)],
    )
    return rowToRecord(result.rows[0]!)
  }
  memory.set(record.key, record)
  return record
}
