import 'server-only'
import { NEWSROOM_ROLES, type NewsroomRole } from '@/lib/admin-roles'
import { cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string | null
  email_verified?: boolean | null
  created_at?: Date | string | null
  updated_at?: Date | string | null
}

type InviteRow = {
  id: string
  email: string
  role: NewsroomRole
  invited_by: string
  status: 'pending' | 'accepted' | 'revoked'
  created_at: Date | string
}

export type NewsroomUserRecord = {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'invited'
  createdAt?: string
}

export type NewsroomInvite = {
  id: string
  email: string
  role: NewsroomRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
}

const invites = new Map<string, NewsroomInvite>()

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('newsroom-users', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_user_invites (
        id text PRIMARY KEY,
        email text NOT NULL,
        role text NOT NULL,
        invited_by text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS nw_user_invites_email_idx ON nw_user_invites(email, status)`)
  })
}

function inviteId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function normalizeRole(value: unknown): NewsroomRole {
  return NEWSROOM_ROLES.includes(value as NewsroomRole) ? (value as NewsroomRole) : 'viewer'
}

function userFromRow(row: UserRow): NewsroomUserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email.split('@')[0] ?? row.email,
    role: row.role ?? 'reader',
    status: 'active',
    createdAt: row.created_at ? toIso(row.created_at) : undefined,
  }
}

function inviteFromRow(row: InviteRow): NewsroomInvite {
  return { id: row.id, email: row.email, role: row.role, invitedBy: row.invited_by, status: row.status, createdAt: toIso(row.created_at) }
}

export async function listNewsroomUsers(fallback?: NewsroomUserRecord): Promise<NewsroomUserRecord[]> {
  const pool = await ensureSchema()
  if (pool) {
    const candidates = ['"user"', 'user']
    for (const table of candidates) {
      try {
        const result = await pool.query<UserRow>(`SELECT id, email, name, role, created_at FROM ${table} ORDER BY created_at DESC LIMIT 500`)
        return result.rows.map(userFromRow)
      } catch {
      }
    }
  }
  return fallback ? [fallback] : []
}

export async function listNewsroomInvites(): Promise<NewsroomInvite[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<InviteRow>(`SELECT * FROM nw_user_invites ORDER BY created_at DESC LIMIT 200`)
    return result.rows.map(inviteFromRow)
  }
  return Array.from(invites.values()).sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function createNewsroomInvite(input: { email: unknown; role: unknown; invitedBy: string }): Promise<NewsroomInvite | null> {
  const email = cleanText(input.email, 200).toLowerCase()
  if (!email.includes('@')) return null
  const invite: NewsroomInvite = {
    id: inviteId(),
    email,
    role: normalizeRole(input.role),
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<InviteRow>(
      `INSERT INTO nw_user_invites (id, email, role, invited_by, status)
       VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
      [invite.id, invite.email, invite.role, invite.invitedBy],
    )
    return inviteFromRow(result.rows[0]!)
  }
  invites.set(invite.id, invite)
  return invite
}

export async function updateUserRoleByEmail(emailValue: unknown, roleValue: unknown): Promise<boolean> {
  const email = cleanText(emailValue, 200).toLowerCase()
  const role = normalizeRole(roleValue)
  if (!email.includes('@')) return false
  const pool = await ensureSchema()
  if (!pool) return false
  for (const table of ['"user"', 'user']) {
    try {
      const result = await pool.query(`UPDATE ${table} SET role = $1 WHERE email = $2`, [role, email])
      return Number(result.rowCount ?? 0) > 0
    } catch {
    }
  }
  return false
}
