import 'server-only'
import { cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type NewsletterIssueStatus = 'draft' | 'queued' | 'sent' | 'failed'

export type NewsletterIssue = {
  id: string
  subject: string
  body: string
  segment: string
  status: NewsletterIssueStatus
  providerMessage?: string
  createdAt: string
  updatedAt: string
}

export type NewsletterSubscriber = {
  email: string
  status: 'active' | 'unsubscribed'
  source: string
  createdAt: string
}

type IssueRow = {
  id: string
  subject: string
  body: string
  segment: string
  status: NewsletterIssueStatus
  provider_message: string | null
  created_at: Date | string
  updated_at: Date | string
}

type SubscriberRow = { email: string; status: 'active' | 'unsubscribed'; source: string; created_at: Date | string }

const issues = new Map<string, NewsletterIssue>()
const subscribers = new Map<string, NewsletterSubscriber>()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('newsletter-admin', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_newsletter_issues (
        id text PRIMARY KEY,
        subject text NOT NULL,
        body text NOT NULL,
        segment text NOT NULL DEFAULT 'all',
        status text NOT NULL DEFAULT 'draft',
        provider_message text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_newsletter_subscribers (
        email text PRIMARY KEY,
        status text NOT NULL DEFAULT 'active',
        source text NOT NULL DEFAULT 'site',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

function id(): string {
  return `nl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function issueFromRow(row: IssueRow): NewsletterIssue {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    segment: row.segment,
    status: row.status,
    providerMessage: row.provider_message ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function subscriberFromRow(row: SubscriberRow): NewsletterSubscriber {
  return { email: row.email, status: row.status, source: row.source, createdAt: toIso(row.created_at) }
}

export async function listNewsletterIssues(): Promise<NewsletterIssue[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<IssueRow>(`SELECT * FROM nw_newsletter_issues ORDER BY created_at DESC LIMIT 100`)
    return result.rows.map(issueFromRow)
  }
  return Array.from(issues.values()).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(`SELECT * FROM nw_newsletter_subscribers ORDER BY created_at DESC LIMIT 500`)
    return result.rows.map(subscriberFromRow)
  }
  return Array.from(subscribers.values())
}

export async function upsertNewsletterSubscriber(input: { email: unknown; source?: unknown }): Promise<NewsletterSubscriber | null> {
  const email = cleanText(input.email, 200).toLowerCase()
  if (!email.includes('@')) return null
  const source = cleanText(input.source || 'admin', 80)
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubscriberRow>(
      `INSERT INTO nw_newsletter_subscribers (email, status, source)
       VALUES ($1,'active',$2)
       ON CONFLICT (email) DO UPDATE SET status = 'active', source = EXCLUDED.source
       RETURNING *`,
      [email, source],
    )
    return subscriberFromRow(result.rows[0]!)
  }
  const subscriber = { email, source, status: 'active' as const, createdAt: new Date().toISOString() }
  subscribers.set(email, subscriber)
  return subscriber
}

export async function createNewsletterIssue(input: { subject: unknown; body: unknown; segment?: unknown; sendNow?: boolean }): Promise<NewsletterIssue> {
  const now = new Date().toISOString()
  const providerReady = Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST || process.env.NEWSLETTER_API_KEY)
  const status: NewsletterIssueStatus = input.sendNow ? (providerReady ? 'queued' : 'queued') : 'draft'
  const issue: NewsletterIssue = {
    id: id(),
    subject: cleanText(input.subject, 180) || 'Nagarik Watch newsletter',
    body: cleanMultiline(input.body, 12000),
    segment: cleanText(input.segment || 'all', 80),
    status,
    providerMessage: input.sendNow
      ? providerReady
        ? 'Queued for configured provider handoff.'
        : 'Queued locally because no email provider is configured.'
      : undefined,
    createdAt: now,
    updatedAt: now,
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<IssueRow>(
      `INSERT INTO nw_newsletter_issues (id, subject, body, segment, status, provider_message)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [issue.id, issue.subject, issue.body, issue.segment, issue.status, issue.providerMessage ?? null],
    )
    return issueFromRow(result.rows[0]!)
  }
  issues.set(issue.id, issue)
  return issue
}
