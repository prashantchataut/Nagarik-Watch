import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type ContactMessageStatus = 'unread' | 'in_review' | 'resolved'

export type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  locale: 'ne' | 'en'
  status: ContactMessageStatus
  createdAt: string
  updatedAt: string
}

type ContactRow = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  locale: 'ne' | 'en'
  status: ContactMessageStatus
  created_at: Date | string
  updated_at: Date | string
}

type LocalStore = { messages: ContactMessage[] }

const LOCAL_STORE_PATH =
  process.env.CONTACT_STORE_PATH ?? path.join(process.cwd(), '.data', 'contact-messages.json')
let localWriteQueue = Promise.resolve()

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'
}

async function schema(): Promise<Queryable | null> {
  const pool = await ensureOperationalSchema('contact-messages', async (database) => {
    await database.query(`
      CREATE TABLE IF NOT EXISTS nw_contact_messages (
        id text PRIMARY KEY,
        name text NOT NULL,
        email text NOT NULL,
        subject text NOT NULL,
        message text NOT NULL,
        locale text NOT NULL DEFAULT 'ne',
        status text NOT NULL DEFAULT 'unread',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await database.query(
      `CREATE INDEX IF NOT EXISTS nw_contact_messages_status_idx ON nw_contact_messages(status, created_at DESC)`,
    )
  })
  if (!pool && isProductionRuntime()) {
    throw new Error('DATABASE_URL is required for contact-message persistence in production')
  }
  return pool
}

function fromRow(row: ContactRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    locale: row.locale,
    status: row.status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

async function readLocal(): Promise<LocalStore> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return { messages: [] }
  try {
    const value = JSON.parse(await readFile(LOCAL_STORE_PATH, 'utf8')) as Partial<LocalStore>
    return { messages: Array.isArray(value.messages) ? value.messages : [] }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { messages: [] }
    throw new Error(`Unable to read local contact store: ${(error as Error).message}`)
  }
}

async function writeLocal(store: LocalStore): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
  const temporaryPath = `${LOCAL_STORE_PATH}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, LOCAL_STORE_PATH)
}

async function mutateLocal<T>(operation: (store: LocalStore) => T | Promise<T>): Promise<T> {
  let result!: T
  localWriteQueue = localWriteQueue.then(async () => {
    const store = await readLocal()
    result = await operation(store)
    await writeLocal(store)
  })
  await localWriteQueue
  return result
}

function asStatus(value: unknown): ContactMessageStatus {
  return value === 'in_review' || value === 'resolved' ? value : 'unread'
}

export async function createContactMessage(input: {
  name: unknown
  email: unknown
  subject: unknown
  message: unknown
  locale: unknown
}): Promise<ContactMessage> {
  const name = cleanText(input.name, 120)
  const email = cleanText(input.email, 254).toLowerCase()
  const subject = cleanText(input.subject, 180)
  const message = cleanMultiline(input.message, 5000)
  if (!name || !email || !subject || !message) {
    throw new Error('Name, email, subject and message are required')
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('A valid email address is required')

  const now = new Date().toISOString()
  const record: ContactMessage = {
    id: randomUUID(),
    name,
    email,
    subject,
    message,
    locale: input.locale === 'en' ? 'en' : 'ne',
    status: 'unread',
    createdAt: now,
    updatedAt: now,
  }
  const pool = await schema()
  if (pool) {
    const result = await pool.query<ContactRow>(
      `INSERT INTO nw_contact_messages (id, name, email, subject, message, locale, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [record.id, record.name, record.email, record.subject, record.message, record.locale, record.status],
    )
    const saved = result.rows[0]
    if (!saved) throw new Error('Contact message was not persisted')
    return fromRow(saved)
  }
  return mutateLocal((store) => {
    store.messages.unshift(record)
    return record
  })
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  const pool = await schema()
  if (pool) {
    const result = await pool.query<ContactRow>(
      `SELECT * FROM nw_contact_messages ORDER BY
       CASE status WHEN 'unread' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,
       created_at DESC`,
    )
    return result.rows.map(fromRow)
  }
  const priority = { unread: 0, in_review: 1, resolved: 2 }
  return (await readLocal()).messages.sort(
    (a, b) => priority[a.status] - priority[b.status] || b.createdAt.localeCompare(a.createdAt),
  )
}

export async function updateContactMessageStatus(
  id: string,
  nextStatus: ContactMessageStatus,
): Promise<ContactMessage | null> {
  const normalized = asStatus(nextStatus)
  const pool = await schema()
  if (pool) {
    const result = await pool.query<ContactRow>(
      `UPDATE nw_contact_messages SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, normalized],
    )
    return result.rows[0] ? fromRow(result.rows[0]) : null
  }
  return mutateLocal((store) => {
    const index = store.messages.findIndex((message) => message.id === id)
    if (index < 0) return null
    const updated = {
      ...store.messages[index]!,
      status: normalized,
      updatedAt: new Date().toISOString(),
    }
    store.messages[index] = updated
    return updated
  })
}
