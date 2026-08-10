import 'server-only'
import {
  cleanMultiline,
  cleanText,
  ensureOperationalSchema,
  requireOperationalPool,
  toIso,
  type Queryable,
} from '@/lib/ops-db'
import { getEmailProviderState, sendEmail } from '@/lib/email-provider'
import {
  listNewsletterSubscribers as listSubscribers,
  upsertConfirmedNewsletterSubscriber,
  type NewsletterSubscriber,
} from '@/lib/newsletter-subscribers'

export type NewsletterIssueStatus = 'draft' | 'queued' | 'sending' | 'sent' | 'failed'

export type NewsletterIssue = {
  id: string
  subject: string
  body: string
  segment: 'all'
  status: NewsletterIssueStatus
  providerMessage?: string
  createdAt: string
  updatedAt: string
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

const issues = new Map<string, NewsletterIssue>()
const MAX_DIRECT_RECIPIENTS = 100

async function ensureSchema(): Promise<Queryable | null> {
  return requireOperationalPool(
    await ensureOperationalSchema('newsletter-admin-v2', async (pool) => {
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
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_newsletter_issue_status_idx ON nw_newsletter_issues(status, created_at)`,
      )
    }),
  )
}

function id(): string {
  return `nl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function issueFromRow(row: IssueRow): NewsletterIssue {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    segment: 'all',
    status: row.status,
    providerMessage: row.provider_message ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

async function saveIssue(issue: NewsletterIssue): Promise<NewsletterIssue> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<IssueRow>(
      `INSERT INTO nw_newsletter_issues
        (id, subject, body, segment, status, provider_message, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET
         subject = EXCLUDED.subject,
         body = EXCLUDED.body,
         segment = EXCLUDED.segment,
         status = EXCLUDED.status,
         provider_message = EXCLUDED.provider_message,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [
        issue.id,
        issue.subject,
        issue.body,
        issue.segment,
        issue.status,
        issue.providerMessage ?? null,
        issue.createdAt,
        issue.updatedAt,
      ],
    )
    return issueFromRow(result.rows[0]!)
  }
  issues.set(issue.id, issue)
  return issue
}

export async function listNewsletterIssues(): Promise<NewsletterIssue[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<IssueRow>(
      `SELECT * FROM nw_newsletter_issues ORDER BY created_at DESC LIMIT 100`,
    )
    return result.rows.map(issueFromRow)
  }
  return Array.from(issues.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  return listSubscribers(500)
}

export async function upsertNewsletterSubscriber(input: {
  email: unknown
  source?: unknown
}): Promise<NewsletterSubscriber | null> {
  return upsertConfirmedNewsletterSubscriber(input)
}

export async function createNewsletterIssue(input: {
  subject: unknown
  body: unknown
  sendNow?: boolean
}): Promise<NewsletterIssue> {
  const now = new Date().toISOString()
  const provider = getEmailProviderState()
  const issue: NewsletterIssue = {
    id: id(),
    subject: cleanText(input.subject, 180) || 'Nagarik Watch newsletter',
    body: cleanMultiline(input.body, 12_000),
    segment: 'all',
    status: input.sendNow ? (provider.ready ? 'queued' : 'failed') : 'draft',
    providerMessage: input.sendNow
      ? provider.ready
        ? `Queued for ${provider.provider}. Use “Process queue” to deliver it.`
        : `Not queued: ${provider.detail}.`
      : undefined,
    createdAt: now,
    updatedAt: now,
  }
  return saveIssue(issue)
}

async function queuedIssues(limit: number): Promise<NewsletterIssue[]> {
  const safeLimit = Math.max(1, Math.min(limit, 5))
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<IssueRow>(
      `SELECT * FROM nw_newsletter_issues
       WHERE status = 'queued'
       ORDER BY created_at ASC
       LIMIT $1`,
      [safeLimit],
    )
    return result.rows.map(issueFromRow)
  }
  return Array.from(issues.values())
    .filter((issue) => issue.status === 'queued')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, safeLimit)
}

async function markIssue(
  issue: NewsletterIssue,
  status: NewsletterIssueStatus,
  providerMessage: string,
): Promise<NewsletterIssue> {
  return saveIssue({ ...issue, status, providerMessage, updatedAt: new Date().toISOString() })
}

export type NewsletterProcessingResult = {
  processed: number
  delivered: number
  failed: number
  detail: string
}

/**
 * Deliver a small-newsroom queue synchronously. This deliberately caps each run
 * so an accidental large import cannot exhaust a serverless invocation. Re-run
 * the action after splitting large audiences in a dedicated provider campaign.
 */
export async function processNewsletterQueue(maxIssues = 1): Promise<NewsletterProcessingResult> {
  const provider = getEmailProviderState()
  if (!provider.ready) {
    return { processed: 0, delivered: 0, failed: 0, detail: provider.detail }
  }

  const queue = await queuedIssues(maxIssues)
  if (!queue.length) {
    return { processed: 0, delivered: 0, failed: 0, detail: 'No queued newsletter issue.' }
  }

  const confirmed = (await listSubscribers(500)).filter(
    (subscriber) => subscriber.status === 'confirmed',
  )
  if (confirmed.length > MAX_DIRECT_RECIPIENTS) {
    const message = `Direct delivery is limited to ${MAX_DIRECT_RECIPIENTS} confirmed subscribers per issue. Export or sync the audience to a campaign provider before sending to ${confirmed.length} subscribers.`
    for (const issue of queue) await markIssue(issue, 'failed', message)
    return { processed: queue.length, delivered: 0, failed: queue.length, detail: message }
  }

  let delivered = 0
  let failed = 0

  for (const issue of queue) {
    await markIssue(issue, 'sending', `Sending through ${provider.provider}.`)
    if (!confirmed.length) {
      await markIssue(issue, 'failed', 'No confirmed subscribers. Nothing was sent.')
      failed += 1
      continue
    }

    const errors: string[] = []
    for (const subscriber of confirmed) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject: issue.subject,
          text: issue.body,
        })
        delivered += 1
      } catch (error) {
        errors.push(
          `${subscriber.email}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }

    if (errors.length) {
      failed += errors.length
      await markIssue(
        issue,
        'failed',
        `Delivered ${confirmed.length - errors.length}/${confirmed.length}. ${errors.slice(0, 2).join(' | ')}`,
      )
    } else {
      await markIssue(
        issue,
        'sent',
        `Delivered to ${confirmed.length} confirmed subscriber(s) through ${provider.provider}.`,
      )
    }
  }

  return {
    processed: queue.length,
    delivered,
    failed,
    detail: `Processed ${queue.length} issue(s); delivered ${delivered}; failures ${failed}.`,
  }
}
