import 'server-only'
import { cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type Poll = {
  id: string
  question: string
  options: string[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

type Row = { id: string; question: string; options: string[]; status: 'draft' | 'active' | 'closed'; created_at: Date | string; updated_at: Date | string }
const memory = new Map<string, Poll>()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('polls-admin', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_polls (
        id text PRIMARY KEY,
        question text NOT NULL,
        options jsonb NOT NULL,
        status text NOT NULL DEFAULT 'draft',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

function id(): string { return `poll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}` }
function rowToPoll(row: Row): Poll { return { id: row.id, question: row.question, options: Array.isArray(row.options) ? row.options : [], status: row.status, createdAt: toIso(row.created_at), updatedAt: toIso(row.updated_at) } }
function status(value: unknown): Poll['status'] { return value === 'active' || value === 'closed' ? value : 'draft' }

export async function listPolls(): Promise<Poll[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_polls ORDER BY created_at DESC LIMIT 100`)
    return result.rows.map(rowToPoll)
  }
  return Array.from(memory.values()).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function createPoll(input: { question: unknown; options: unknown; status?: unknown }): Promise<Poll | null> {
  const question = cleanText(input.question, 220)
  const options = cleanMultiline(input.options, 1000).split('\n').map((value) => cleanText(value, 160)).filter(Boolean).slice(0, 8)
  if (!question || options.length < 2) return null
  const now = new Date().toISOString()
  const poll: Poll = { id: id(), question, options, status: status(input.status), createdAt: now, updatedAt: now }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`INSERT INTO nw_polls (id, question, options, status) VALUES ($1,$2,$3::jsonb,$4) RETURNING *`, [poll.id, poll.question, JSON.stringify(poll.options), poll.status])
    return rowToPoll(result.rows[0]!)
  }
  memory.set(poll.id, poll)
  return poll
}
