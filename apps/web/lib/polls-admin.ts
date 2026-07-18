import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { cleanMultiline, cleanText, ensureOperationalSchema, isProductionRuntime, requireOperationalPool, toIso, type Queryable } from '@/lib/ops-db'
import { getPollVoteCounts } from '@/lib/engagement/store'

export type Poll = {
  id: string
  question: string
  options: string[]
  status: 'draft' | 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export type PublicPoll = Poll & { results: Record<string, number> }

type Row = {
  id: string
  question: string
  options: string[]
  status: 'draft' | 'active' | 'closed'
  created_at: Date | string
  updated_at: Date | string
}

const LOCAL_FILE = path.resolve(process.cwd(), process.env.POLLS_STORE_PATH ?? '.data/polls.json')
let localCache: Poll[] | null = null
let localWrite: Promise<void> = Promise.resolve()

async function readLocal(): Promise<Poll[]> {
  if (localCache) return localCache
  try {
    const parsed = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as { polls?: Poll[] }
    localCache = Array.isArray(parsed.polls) ? parsed.polls : []
  } catch (error) {
    const code = error instanceof Error && 'code' in error ? String((error as NodeJS.ErrnoException).code) : ''
    if (code !== 'ENOENT') throw error
    localCache = []
  }
  return localCache
}

async function writeLocal(polls: Poll[]): Promise<void> {
  localCache = polls
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    const temporary = `${LOCAL_FILE}.${process.pid}.tmp`
    await fs.writeFile(temporary, JSON.stringify({ version: 1, polls }, null, 2), 'utf8')
    await fs.rename(temporary, LOCAL_FILE)
  })
  await localWrite
}

async function ensureSchema(): Promise<Queryable | null> {
  return requireOperationalPool(await ensureOperationalSchema('polls-admin', async (pool) => {
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
  }))
}

function id(): string {
  return `poll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function rowToPoll(row: Row): Poll {
  return {
    id: row.id,
    question: row.question,
    options: Array.isArray(row.options) ? row.options : [],
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function status(value: unknown): Poll['status'] {
  return value === 'active' || value === 'closed' ? value : 'draft'
}

export async function listPolls(): Promise<Poll[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(`SELECT * FROM nw_polls ORDER BY created_at DESC LIMIT 100`)
    return result.rows.map(rowToPoll)
  }
  return (await readLocal()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getActivePoll(): Promise<PublicPoll | null> {
  try {
    const pool = await ensureSchema()
    let poll: Poll | null = null

    if (pool) {
      const result = await pool.query<Row>(
        `SELECT * FROM nw_polls WHERE status = 'active' ORDER BY updated_at DESC LIMIT 1`,
      )
      poll = result.rows[0] ? rowToPoll(result.rows[0]) : null
    } else {
      poll = (await readLocal())
        .filter((candidate) => candidate.status === 'active')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    }

    if (!poll) return null
    return { ...poll, results: await getPollVoteCounts(poll.id) }
  } catch (error) {
    if (isProductionRuntime()) throw error
    console.error('[polls] getActivePoll failed', error instanceof Error ? error.message : error)
    return null
  }
}

export async function getPollForVoting(pollId: string): Promise<Poll | null> {
  const cleanId = cleanText(pollId, 120)
  if (!cleanId) return null
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `SELECT * FROM nw_polls WHERE id = $1 AND status = 'active' LIMIT 1`,
      [cleanId],
    )
    return result.rows[0] ? rowToPoll(result.rows[0]) : null
  }
  const poll = (await readLocal()).find((candidate) => candidate.id === cleanId)
  return poll?.status === 'active' ? poll : null
}

export async function createPoll(input: {
  question: unknown
  options: unknown
  status?: unknown
}): Promise<Poll | null> {
  const question = cleanText(input.question, 220)
  const options = cleanMultiline(input.options, 1000)
    .split('\n')
    .map((value) => cleanText(value, 160))
    .filter(Boolean)
    .slice(0, 8)
  if (!question || options.length < 2) return null

  const now = new Date().toISOString()
  const poll: Poll = {
    id: id(),
    question,
    options,
    status: status(input.status),
    createdAt: now,
    updatedAt: now,
  }
  const pool = await ensureSchema()
  if (pool) {
    if (poll.status === 'active') {
      await pool.query(
        `UPDATE nw_polls SET status = 'closed', updated_at = now() WHERE status = 'active'`,
      )
    }
    const result = await pool.query<Row>(
      `INSERT INTO nw_polls (id, question, options, status) VALUES ($1,$2,$3::jsonb,$4) RETURNING *`,
      [poll.id, poll.question, JSON.stringify(poll.options), poll.status],
    )
    return rowToPoll(result.rows[0]!)
  }

  const current = await readLocal()
  const next = current.map((existing) =>
    poll.status === 'active' && existing.status === 'active'
      ? { ...existing, status: 'closed' as const, updatedAt: now }
      : existing,
  )
  next.push(poll)
  await writeLocal(next)
  return poll
}
