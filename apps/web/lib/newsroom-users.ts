import 'server-only'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { NEWSROOM_ROLES, type NewsroomRole } from '@/lib/admin-roles'
import { sendEmail } from '@/lib/email-provider'
import { cleanText, ensureOperationalSchema, isProductionRuntime, toIso, type Queryable } from '@/lib/ops-db'
import { SITE_URL } from '@/lib/site'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string | null
  disabled?: boolean | null
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
  expires_at: Date | string
  accepted_at?: Date | string | null
  revoked_at?: Date | string | null
}

type StoredInvite = NewsroomInvite & { tokenHash: string }

export type NewsroomUserRecord = {
  id: string
  email: string
  name: string
  role: string
  status: 'active' | 'invited' | 'disabled'
  disabled: boolean
  createdAt?: string
}

export type NewsroomInvite = {
  id: string
  email: string
  role: NewsroomRole
  invitedBy: string
  status: 'pending' | 'accepted' | 'revoked'
  createdAt: string
  expiresAt: string
  acceptedAt?: string
  revokedAt?: string
}

export type InviteAcceptance =
  | { ok: true; role: NewsroomRole }
  | { ok: false; reason: 'invalid' | 'expired' | 'email_mismatch' | 'account_missing' | 'storage_unavailable' }

const invites = new Map<string, StoredInvite>()
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('newsroom-users-v3', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_user_invites (
        id text PRIMARY KEY,
        email text NOT NULL,
        role text NOT NULL,
        invited_by text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        token_hash text,
        created_at timestamptz NOT NULL DEFAULT now(),
        expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
        accepted_at timestamptz,
        revoked_at timestamptz
      )
    `)
    await pool.query(`ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS token_hash text`)
    await pool.query(`ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')`)
    await pool.query(`ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS accepted_at timestamptz`)
    await pool.query(`ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS revoked_at timestamptz`)
    await pool.query(`CREATE INDEX IF NOT EXISTS nw_user_invites_email_idx ON nw_user_invites(email, status)`)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS nw_user_invites_token_hash_idx ON nw_user_invites(token_hash) WHERE token_hash IS NOT NULL`)
    for (const table of ['"user"', 'user']) {
      try {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false`)
        break
      } catch {
        // Quoting differs by adapter; try the next candidate.
      }
    }
  })
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function normalizeRole(value: unknown): NewsroomRole {
  const role = value as NewsroomRole
  return NEWSROOM_ROLES.includes(role) && role !== 'reader' ? role : 'viewer'
}

function userFromRow(row: UserRow): NewsroomUserRecord {
  const disabled = Boolean(row.disabled)
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email.split('@')[0] ?? row.email,
    role: row.role ?? 'reader',
    status: disabled ? 'disabled' : 'active',
    disabled,
    createdAt: row.created_at ? toIso(row.created_at) : undefined,
  }
}

function inviteFromRow(row: InviteRow): NewsroomInvite {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by,
    status: row.status,
    createdAt: toIso(row.created_at),
    expiresAt: toIso(row.expires_at),
    acceptedAt: row.accepted_at ? toIso(row.accepted_at) : undefined,
    revokedAt: row.revoked_at ? toIso(row.revoked_at) : undefined,
  }
}

function validEmail(value: unknown): string | null {
  const email = cleanText(value, 200).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export function rolesAssignableBy(actorRole: NewsroomRole): NewsroomRole[] {
  const roles = NEWSROOM_ROLES.filter((role) => role !== 'reader')
  if (actorRole === 'super_admin') return [...roles]
  if (actorRole === 'admin') return roles.filter((role) => role !== 'admin' && role !== 'super_admin')
  return []
}

export async function listNewsroomUsers(fallback?: NewsroomUserRecord): Promise<NewsroomUserRecord[]> {
  const pool = await ensureSchema()
  if (pool) {
    const candidates = ['"user"', 'user']
    let lastError: unknown
    for (const table of candidates) {
      try {
        const result = await pool.query<UserRow>(
          `SELECT id, email, name, role, disabled, created_at FROM ${table} ORDER BY created_at DESC LIMIT 500`,
        )
        return result.rows.map(userFromRow)
      } catch (error) {
        lastError = error
        // Older schemas may lack disabled until ALTER runs; retry without it.
        try {
          const result = await pool.query<UserRow>(
            `SELECT id, email, name, role, created_at FROM ${table} ORDER BY created_at DESC LIMIT 500`,
          )
          return result.rows.map(userFromRow)
        } catch {
          // Continue to next table quoting style.
        }
      }
    }
    if (isProductionRuntime()) throw new Error('Unable to read Better Auth users.', { cause: lastError })
  }
  return fallback ? [{ ...fallback, disabled: fallback.disabled ?? false }] : []
}

export async function setNewsroomUserDisabled(input: {
  email: unknown
  disabled: boolean
  actorEmail: string
  actorRole: NewsroomRole
}): Promise<boolean> {
  const email = validEmail(input.email)
  if (!email || !['admin', 'super_admin'].includes(input.actorRole)) return false
  if (email === input.actorEmail.toLowerCase()) return false

  const users = await listNewsroomUsers()
  const target = users.find((user) => user.email.toLowerCase() === email)
  if (!target) return false
  if (
    input.actorRole !== 'super_admin' &&
    ['admin', 'super_admin'].includes(target.role)
  ) {
    return false
  }

  const pool = await ensureSchema()
  if (!pool) return false
  let lastError: unknown
  for (const table of ['"user"', 'user']) {
    try {
      const result = await pool.query(
        `UPDATE ${table} SET disabled = $1 WHERE lower(email) = lower($2)`,
        [input.disabled, email],
      )
      return Number(result.rowCount ?? 0) > 0
    } catch (error) {
      lastError = error
    }
  }
  if (isProductionRuntime()) throw new Error('Unable to update account disabled state.', { cause: lastError })
  return false
}

export async function listNewsroomInvites(): Promise<NewsroomInvite[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<InviteRow>(`SELECT id, email, role, invited_by, status, created_at, expires_at, accepted_at, revoked_at FROM nw_user_invites ORDER BY created_at DESC LIMIT 200`)
    return result.rows.map(inviteFromRow)
  }
  return Array.from(invites.values())
    .map(({ tokenHash: _tokenHash, ...invite }) => invite)
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function createNewsroomInvite(input: { email: unknown; role: unknown; invitedBy: string; actorRole: NewsroomRole }): Promise<NewsroomInvite | null> {
  const email = validEmail(input.email)
  if (!email) return null
  const role = normalizeRole(input.role)
  if (!rolesAssignableBy(input.actorRole).includes(role)) throw new Error('You cannot assign that newsroom role.')

  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  const invite: NewsroomInvite = {
    id: randomUUID(),
    email,
    role,
    invitedBy: input.invitedBy,
    status: 'pending',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    await pool.query(`UPDATE nw_user_invites SET status = 'revoked', revoked_at = now() WHERE lower(email) = lower($1) AND status = 'pending'`, [email])
    const result = await pool.query<InviteRow>(
      `INSERT INTO nw_user_invites (id, email, role, invited_by, status, token_hash, created_at, expires_at)
       VALUES ($1,$2,$3,$4,'pending',$5,$6,$7)
       RETURNING id, email, role, invited_by, status, created_at, expires_at, accepted_at, revoked_at`,
      [invite.id, invite.email, invite.role, invite.invitedBy, tokenHash, invite.createdAt, invite.expiresAt],
    )
    const saved = inviteFromRow(result.rows[0]!)
    try {
      await deliverInvite(saved, token)
      return saved
    } catch (error) {
      await pool.query(`UPDATE nw_user_invites SET status = 'revoked', revoked_at = now() WHERE id = $1`, [saved.id])
      throw error
    }
  }

  for (const [id, existing] of invites) {
    if (existing.email === email && existing.status === 'pending') {
      invites.set(id, { ...existing, status: 'revoked', revokedAt: new Date().toISOString() })
    }
  }
  invites.set(invite.id, { ...invite, tokenHash })
  try {
    await deliverInvite(invite, token)
    return invite
  } catch (error) {
    invites.set(invite.id, { ...invite, tokenHash, status: 'revoked', revokedAt: new Date().toISOString() })
    throw error
  }
}

async function deliverInvite(invite: NewsroomInvite, token: string): Promise<void> {
  const link = `${SITE_URL}/auth/invite?token=${encodeURIComponent(token)}`
  await sendEmail({
    to: invite.email,
    from: process.env.AUTH_EMAIL_FROM?.trim() || undefined,
    subject: 'नागरिक वाच न्युजरुम निमन्त्रणा',
    text: [
      'नमस्कार,',
      '',
      `तपाईंलाई नागरिक वाच न्युजरुममा “${invite.role}” भूमिकाका लागि निमन्त्रणा गरिएको छ।`,
      'पहिले खाता बनाएर वा लगइन गरेर तलको सुरक्षित लिंक खोल्नुहोस्:',
      link,
      '',
      'यो लिंक सात दिनसम्म मात्र मान्य हुन्छ र निमन्त्रणा गरिएको इमेलसँग मिल्ने खाताबाट मात्र स्वीकार गर्न सकिन्छ।',
      '',
      '— नागरिक वाच',
    ].join('\n'),
  })
}

export async function revokeNewsroomInvite(idValue: unknown): Promise<boolean> {
  const id = cleanText(idValue, 100)
  if (!id) return false
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query(`UPDATE nw_user_invites SET status = 'revoked', revoked_at = now() WHERE id = $1 AND status = 'pending'`, [id])
    return Number(result.rowCount ?? 0) > 0
  }
  const invite = invites.get(id)
  if (!invite || invite.status !== 'pending') return false
  invites.set(id, { ...invite, status: 'revoked', revokedAt: new Date().toISOString() })
  return true
}

export async function acceptNewsroomInvite(input: { token: unknown; email: string }): Promise<InviteAcceptance> {
  const token = cleanText(input.token, 500)
  const email = validEmail(input.email)
  if (!token || !email || token.length < 30) return { ok: false, reason: 'invalid' }
  const tokenHash = hashToken(token)
  const pool = await ensureSchema()
  if (pool) {
    const inviteResult = await pool.query<InviteRow>(
      `SELECT id, email, role, invited_by, status, created_at, expires_at, accepted_at, revoked_at
       FROM nw_user_invites WHERE token_hash = $1 LIMIT 1`,
      [tokenHash],
    )
    const invite = inviteResult.rows[0]
    if (!invite || invite.status !== 'pending') return { ok: false, reason: 'invalid' }
    if ((invite.expires_at instanceof Date ? invite.expires_at.getTime() : new Date(invite.expires_at).getTime()) <= Date.now()) return { ok: false, reason: 'expired' }
    if (invite.email.toLowerCase() !== email) return { ok: false, reason: 'email_mismatch' }

    let userExists = false
    for (const table of ['"user"', 'user']) {
      try {
        const result = await pool.query<{ id: string }>(`SELECT id FROM ${table} WHERE lower(email) = lower($1) LIMIT 1`, [email])
        if (result.rows[0]) {
          userExists = true
          break
        }
      } catch {
        // Try the alternate table quoting used by different auth adapters.
      }
    }
    if (!userExists) return { ok: false, reason: 'account_missing' }

    const claimed = await pool.query<InviteRow>(
      `UPDATE nw_user_invites SET status = 'accepted', accepted_at = now()
       WHERE id = $1 AND status = 'pending' AND expires_at > now()
       RETURNING id, email, role, invited_by, status, created_at, expires_at, accepted_at, revoked_at`,
      [invite.id],
    )
    if (!claimed.rows[0]) return { ok: false, reason: 'invalid' }
    const updated = await updateUserRoleByEmail(email, invite.role)
    if (!updated) {
      await pool.query(`UPDATE nw_user_invites SET status = 'pending', accepted_at = NULL WHERE id = $1 AND status = 'accepted'`, [invite.id])
      return { ok: false, reason: 'account_missing' }
    }
    return { ok: true, role: invite.role }
  }

  const stored = Array.from(invites.values()).find((invite) => invite.tokenHash === tokenHash)
  if (!stored || stored.status !== 'pending') return { ok: false, reason: 'invalid' }
  if (new Date(stored.expiresAt).getTime() <= Date.now()) return { ok: false, reason: 'expired' }
  if (stored.email !== email) return { ok: false, reason: 'email_mismatch' }
  return { ok: false, reason: 'storage_unavailable' }
}

export async function updateNewsroomUserRole(input: {
  email: unknown
  role: unknown
  actorEmail: string
  actorRole: NewsroomRole
}): Promise<boolean> {
  const email = validEmail(input.email)
  const desiredRole = NEWSROOM_ROLES.includes(input.role as NewsroomRole)
    ? (input.role as NewsroomRole)
    : null
  if (!email || !desiredRole || !['admin', 'super_admin'].includes(input.actorRole)) return false
  if (email === input.actorEmail.toLowerCase() && desiredRole !== input.actorRole) return false

  const users = await listNewsroomUsers()
  const target = users.find((user) => user.email.toLowerCase() === email)
  if (!target) return false
  if (
    input.actorRole !== 'super_admin' &&
    (['admin', 'super_admin'].includes(target.role) || ['admin', 'super_admin'].includes(desiredRole))
  ) return false

  return updateUserRoleByEmail(email, desiredRole)
}

export async function updateUserRoleByEmail(emailValue: unknown, roleValue: unknown): Promise<boolean> {
  const email = validEmail(emailValue)
  const role = NEWSROOM_ROLES.includes(roleValue as NewsroomRole) ? (roleValue as NewsroomRole) : null
  if (!email || !role) return false
  const pool = await ensureSchema()
  if (!pool) return false
  let lastError: unknown
  for (const table of ['"user"', 'user']) {
    try {
      const result = await pool.query(`UPDATE ${table} SET role = $1 WHERE lower(email) = lower($2)`, [role, email])
      return Number(result.rowCount ?? 0) > 0
    } catch (error) {
      lastError = error
    }
  }
  if (isProductionRuntime()) throw new Error('Unable to update Better Auth user role.', { cause: lastError })
  return false
}
