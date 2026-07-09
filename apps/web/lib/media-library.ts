import 'server-only'
import { cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type MediaItem = {
  id: string
  url: string
  alt: string
  caption?: string
  credit?: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

type Row = { id: string; url: string; alt: string; caption: string | null; credit: string | null; status: 'active' | 'archived'; created_at: Date | string; updated_at: Date | string }
const memory = new Map<string, MediaItem>()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('media-library', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_media_items (
        id text PRIMARY KEY,
        url text NOT NULL,
        alt text NOT NULL,
        caption text,
        credit text,
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

function id(): string { return `media_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` }
function rowToItem(row: Row): MediaItem { return { id: row.id, url: row.url, alt: row.alt, caption: row.caption ?? undefined, credit: row.credit ?? undefined, status: row.status, createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at) } }

export async function listMediaItems(): Promise<MediaItem[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_media_items ORDER BY created_at DESC LIMIT 300`)
    return result.rows.map(rowToItem)
  }
  return Array.from(memory.values()).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function createMediaItem(input: { url: unknown; alt: unknown; caption?: unknown; credit?: unknown }): Promise<MediaItem | null> {
  const url = cleanText(input.url, 600)
  const alt = cleanText(input.alt, 240)
  if (!url || !alt) return null
  const now = new Date().toISOString()
  const item: MediaItem = { id: id(), url, alt, caption: cleanMultiline(input.caption, 800) || undefined, credit: cleanText(input.credit, 160) || undefined, status: 'active', createdAt: now, updatedAt: now }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`INSERT INTO nw_media_items (id, url, alt, caption, credit) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [item.id, item.url, item.alt, item.caption ?? null, item.credit ?? null])
    return rowToItem(result.rows[0]!)
  }
  memory.set(item.id, item)
  return item
}
