import 'server-only'
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { postgresPoolConfig } from '@/lib/db-url'

type AuthApi = {
  api: {
    signUpEmail: (args: { body: Record<string, unknown> }) => Promise<unknown>
  }
}

type BootAccountSpec = {
  emailKey: string
  passwordKey: string
  role: string
  displayName: string
}

const BOOT_SPECS: BootAccountSpec[] = [
  {
    emailKey: 'NEWSROOM_SUPERADMIN_EMAIL',
    passwordKey: 'NEWSROOM_SUPERADMIN_PASSWORD',
    role: 'super_admin',
    displayName: 'मुख्य एडमिन',
  },
  {
    emailKey: 'NEWSROOM_ADMIN_EMAIL',
    passwordKey: 'NEWSROOM_ADMIN_PASSWORD',
    role: 'admin',
    displayName: 'एडमिन',
  },
]

export type BootProvisionResult = {
  configured: number
  created: string[]
  synced: string[]
  failed: string[]
}

export type BootLoginHint = {
  configured: boolean
  maskedEmails: string[]
  provisionedCount: number
  lastError: string | null
}

let lastProvisionError: string | null = null
let provisionPromise: Promise<BootProvisionResult> | null = null
let sharedPool: Queryable | null = null
const passwordSyncedThisProcess = new Set<string>()

const ROLE_RANK: Record<string, number> = { admin: 1, super_admin: 2 }

function configuredSpecs(): Array<BootAccountSpec & { email: string; password: string }> {
  const specs = BOOT_SPECS.flatMap((spec) => {
    const email = process.env[spec.emailKey]?.trim().toLowerCase()
    const password = process.env[spec.passwordKey]
    if (!email || !password) return []
    return [{ ...spec, email, password }]
  })

  // Same email in SUPERADMIN + ADMIN must not demote super_admin → admin.
  const byEmail = new Map<string, BootAccountSpec & { email: string; password: string }>()
  for (const spec of specs) {
    const existing = byEmail.get(spec.email)
    if (!existing || (ROLE_RANK[spec.role] ?? 0) >= (ROLE_RANK[existing.role] ?? 0)) {
      byEmail.set(spec.email, spec)
    }
  }
  return [...byEmail.values()]
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  const keep = local.slice(0, Math.min(2, local.length))
  return `${keep}***@${domain}`
}

type Queryable = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>
}

async function getBootPool(): Promise<Queryable> {
  if (sharedPool) return sharedPool
  const config = postgresPoolConfig()
  if (!config) throw new Error('DATABASE_URL is required to provision newsroom boot accounts.')
  const { Pool } = await import('pg')
  sharedPool = new Pool(config)
  return sharedPool
}

async function withPool<T>(fn: (pool: Queryable) => Promise<T>): Promise<T> {
  return fn(await getBootPool())
}

/** Postgres reserves USER — Better Auth stores rows in the quoted "user" table. */
async function findUserId(email: string): Promise<string | null> {
  return withPool(async (pool) => {
    for (const table of ['"user"', 'user'] as const) {
      try {
        const result = await pool.query<{ id: string }>(
          `SELECT id FROM ${table} WHERE lower(email) = lower($1) LIMIT 1`,
          [email],
        )
        const id = result.rows[0]?.id
        if (id) return String(id)
      } catch {
        // Try the next identifier quoting style.
      }
    }
    return null
  })
}

async function createUserRow(
  spec: BootAccountSpec & { email: string; password: string },
): Promise<string> {
  const id = randomUUID()
  const name =
    process.env[`${spec.emailKey.replace('_EMAIL', '')}_NAME`]?.trim() ||
    spec.email.split('@')[0] ||
    'Newsroom'
  const now = new Date()

  return withPool(async (pool) => {
    const attempts: Array<{ table: string; sql: string; params: unknown[] }> = [
      {
        table: '"user"',
        sql: `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "displayName", locale, disabled)
              VALUES ($1,$2,$3,true,$4,$5,$6,$7,'ne',false)`,
        params: [id, name, spec.email, now, now, spec.role, spec.displayName],
      },
      {
        table: '"user"',
        sql: `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at, role, display_name, locale, disabled)
              VALUES ($1,$2,$3,true,$4,$5,$6,$7,'ne',false)`,
        params: [id, name, spec.email, now, now, spec.role, spec.displayName],
      },
      {
        table: '"user"',
        sql: `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "displayName")
              VALUES ($1,$2,$3,true,$4,$5,$6,$7)`,
        params: [id, name, spec.email, now, now, spec.role, spec.displayName],
      },
      {
        table: 'user',
        sql: `INSERT INTO user (id, name, email, "emailVerified", "createdAt", "updatedAt", role, "displayName")
              VALUES ($1,$2,$3,true,$4,$5,$6,$7)`,
        params: [id, name, spec.email, now, now, spec.role, spec.displayName],
      },
    ]

    let lastError: unknown
    for (const attempt of attempts) {
      try {
        await pool.query(attempt.sql, attempt.params)
        return id
      } catch (error) {
        lastError = error
      }
    }
    throw new Error(`Could not insert boot user ${spec.email}`, { cause: lastError })
  })
}

async function assignBootRole(email: string, role: string, displayName: string): Promise<boolean> {
  return withPool(async (pool) => {
    const attempts: Array<{ sql: string; params: unknown[] }> = [
      {
        sql: `UPDATE "user" SET role = $1, "displayName" = $2 WHERE lower(email) = lower($3)`,
        params: [role, displayName, email],
      },
      {
        sql: `UPDATE "user" SET role = $1, display_name = $2 WHERE lower(email) = lower($3)`,
        params: [role, displayName, email],
      },
      {
        sql: `UPDATE "user" SET role = $1 WHERE lower(email) = lower($2)`,
        params: [role, email],
      },
    ]
    for (const attempt of attempts) {
      try {
        const result = await pool.query(attempt.sql, attempt.params)
        if (Number(result.rowCount ?? 0) > 0) return true
      } catch {
        // next attempt
      }
    }
    return false
  })
}

async function syncCredentialPassword(userId: string, email: string, password: string): Promise<boolean> {
  const hashed = await hashPassword(password)
  const now = new Date()
  return withPool(async (pool) => {
    const findAttempts = [
      `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
      `SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential' LIMIT 1`,
    ]
    let existingId: string | null = null
    for (const sql of findAttempts) {
      try {
        const existing = await pool.query<{ id: string }>(sql, [userId])
        if (existing.rows[0]?.id) {
          existingId = existing.rows[0].id
          break
        }
      } catch {
        // next
      }
    }

    if (existingId) {
      for (const sql of [
        `UPDATE account SET password = $1, "updatedAt" = $2 WHERE id = $3`,
        `UPDATE account SET password = $1, updated_at = $2 WHERE id = $3`,
      ]) {
        try {
          const result = await pool.query(sql, [hashed, now, existingId])
          if (Number(result.rowCount ?? 0) > 0) return true
        } catch {
          // next
        }
      }
      return false
    }

    for (const sql of [
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1,$2,'credential',$3,$4,$5,$6)`,
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       VALUES ($1,$2,'credential',$3,$4,$5,$6)`,
    ]) {
      try {
        await pool.query(sql, [randomUUID(), email, userId, hashed, now, now])
        return true
      } catch {
        // next
      }
    }
    return false
  })
}

async function seedOne(
  auth: AuthApi,
  spec: BootAccountSpec & { email: string; password: string },
): Promise<'created' | 'synced'> {
  let userId = await findUserId(spec.email)
  let created = false

  if (!userId) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: spec.email,
          password: spec.password,
          name:
            process.env[`${spec.emailKey.replace('_EMAIL', '')}_NAME`]?.trim() ||
            spec.email.split('@')[0] ||
            'Newsroom',
          displayName: spec.displayName,
        },
      })
      created = true
      userId = await findUserId(spec.email)
    } catch (signupError) {
      // Prefer direct SQL when Better Auth signup refuses (schema/hook quirks).
      try {
        userId = await createUserRow(spec)
        created = true
      } catch (insertError) {
        userId = await findUserId(spec.email)
        if (!userId) {
          throw new Error(`Could not create boot account ${spec.email}`, {
            cause: insertError ?? signupError,
          })
        }
      }
    }
  }

  if (!userId) {
    userId = await createUserRow(spec)
    created = true
  }

  // Password sync is expensive (bcrypt). Only for new accounts or explicit repair.
  const forceSync = process.env.AUTH_BOOT_SYNC_PASSWORD === 'true'
  if (created || forceSync) {
    const passwordOk = await syncCredentialPassword(userId, spec.email, spec.password)
    if (!passwordOk) throw new Error(`Could not sync password for ${spec.email}.`)
    passwordSyncedThisProcess.add(spec.email)
  }

  const roleOk = await assignBootRole(spec.email, spec.role, spec.displayName)
  if (!roleOk) throw new Error(`Could not assign ${spec.role} to ${spec.email}.`)

  console.info(`[auth] boot account ${created ? 'created' : 'synced'}: ${maskEmail(spec.email)} as ${spec.role}`)
  return created ? 'created' : 'synced'
}

/**
 * Provision / repair newsroom boot accounts from env.
 * Soft-fails: logs errors but never blocks Better Auth from serving sign-in.
 * Cached for the life of the warm serverless instance.
 */
export async function ensureNewsroomBootAccounts(auth: AuthApi): Promise<BootProvisionResult> {
  if (!provisionPromise) {
    provisionPromise = (async (): Promise<BootProvisionResult> => {
      const specs = configuredSpecs()
      const result: BootProvisionResult = {
        configured: specs.length,
        created: [],
        synced: [],
        failed: [],
      }
      if (specs.length === 0) {
        lastProvisionError = 'NEWSROOM_SUPERADMIN_EMAIL/PASSWORD (or ADMIN pair) is not set in Vercel.'
        console.error('[auth]', lastProvisionError)
        return result
      }

      for (const spec of specs) {
        try {
          const status = await seedOne(auth, spec)
          if (status === 'created') result.created.push(maskEmail(spec.email))
          else result.synced.push(maskEmail(spec.email))
        } catch (error) {
          result.failed.push(maskEmail(spec.email))
          console.error(`[auth] boot account provisioning failed for ${spec.email}`, error)
        }
      }

      lastProvisionError =
        result.failed.length > 0
          ? `Failed to provision ${result.failed.join(', ')}. Check DATABASE_URL and env passwords.`
          : null
      console.info('[auth] boot provision result', result)
      return result
    })().catch((error) => {
      provisionPromise = null
      throw error
    })
  }
  return provisionPromise
}

/** Cheap login hint — env check only (no per-email DB round-trips). */
export async function getBootLoginHint(): Promise<BootLoginHint> {
  const specs = configuredSpecs()
  return {
    configured: specs.length > 0,
    maskedEmails: specs.map((spec) => maskEmail(spec.email)),
    provisionedCount: specs.length,
    lastError: lastProvisionError,
  }
}
