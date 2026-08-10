import 'server-only'
import type { NewsroomSession } from '@/lib/auth/session'
import {
  ensureOperationalSchema,
  requireOperationalPool,
  toIso,
  type Queryable,
} from '@/lib/ops-db'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'publish'
  | 'reject'
  | 'approve'
  | 'login'
  | 'role_change'
  | 'settings_change'
  | 'status_change'
  | 'revoke'
  | 'manual_live_update'
  | 'ad_change'
  | 'newsletter_queue'
  | 'newsletter_process'

export type AuditEvent = {
  id: string
  actorId: string
  actorEmail: string
  actorRole: string
  action: AuditAction
  targetType: string
  targetId: string
  summary: string
  meta: Record<string, unknown>
  createdAt: string
}

type Row = {
  id: string
  actor_id: string
  actor_email: string
  actor_role: string
  action: AuditAction
  target_type: string
  target_id: string
  summary: string
  meta: Record<string, unknown>
  created_at: Date | string
}

const memory: AuditEvent[] = []

async function ensureSchema(): Promise<Queryable | null> {
  return requireOperationalPool(
    await ensureOperationalSchema('audit-log', async (pool) => {
      await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_audit_events (
        id text PRIMARY KEY,
        actor_id text NOT NULL,
        actor_email text NOT NULL,
        actor_role text NOT NULL,
        action text NOT NULL,
        target_type text NOT NULL,
        target_id text NOT NULL,
        summary text NOT NULL,
        meta jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_audit_events_created_idx ON nw_audit_events(created_at DESC)`,
      )
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_audit_events_target_idx ON nw_audit_events(target_type, target_id, created_at DESC)`,
      )
    }),
  )
}

function id(): string {
  return `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function rowToEvent(row: Row): AuditEvent {
  return {
    id: row.id,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    meta: row.meta ?? {},
    createdAt: toIso(row.created_at),
  }
}

export async function recordAuditEvent(input: {
  session: NewsroomSession
  action: AuditAction
  targetType: string
  targetId: string
  summary: string
  meta?: Record<string, unknown>
}): Promise<AuditEvent> {
  const event: AuditEvent = {
    id: id(),
    actorId: input.session.userId,
    actorEmail: input.session.email,
    actorRole: input.session.newsroomRole,
    action: input.action,
    targetType: input.targetType.slice(0, 80),
    targetId: input.targetId.slice(0, 160),
    summary: input.summary.slice(0, 500),
    meta: input.meta ?? {},
    createdAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_audit_events (id, actor_id, actor_email, actor_role, action, target_type, target_id, summary, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       RETURNING *`,
      [
        event.id,
        event.actorId,
        event.actorEmail,
        event.actorRole,
        event.action,
        event.targetType,
        event.targetId,
        event.summary,
        JSON.stringify(event.meta),
      ],
    )
    return rowToEvent(result.rows[0]!)
  }
  memory.unshift(event)
  return event
}

export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `SELECT * FROM nw_audit_events ORDER BY created_at DESC LIMIT $1`,
      [limit],
    )
    return result.rows.map(rowToEvent)
  }
  return memory.slice(0, limit)
}
