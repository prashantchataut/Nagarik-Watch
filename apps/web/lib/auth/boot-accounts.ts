import 'server-only'
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { getSharedPool } from '@/lib/pg-pool'
import { getAuthPgliteQueryable } from '@/lib/auth/auth-pool'

type AuthApi = {
  api: {
    signUpEmail: (args: { body: Record<string, unknown> }) => Promise<unknown>
  }
}

type BootAccountSpec = {
  emailKey: string
  passwordKey: string
  nameKey: string
  role: string
}

const BOOT_SPECS: BootAccountSpec[] = [
  {
    emailKey: 'NEWSROOM_SUPERADMIN_EMAIL',
    passwordKey: 'NEWSROOM_SUPERADMIN_PASSWORD',
    nameKey: 'NEWSROOM_SUPERADMIN_NAME',
    role: 'super_admin',
  },
  {
    emailKey: 'NEWSROOM_ADMIN_EMAIL',
    passwordKey: 'NEWSROOM_ADMIN_PASSWORD',
    nameKey: 'NEWSROOM_ADMIN_NAME',
    role: 'admin',
  },
  {
    emailKey: 'NEWSROOM_PUBLISHER_EMAIL',
    passwordKey: 'NEWSROOM_PUBLISHER_PASSWORD',
    nameKey: 'NEWSROOM_PUBLISHER_NAME',
    role: 'publisher',
  },
  {
    emailKey: 'NEWSROOM_EDITOR_EMAIL',
    passwordKey: 'NEWSROOM_EDITOR_PASSWORD',
    nameKey: 'NEWSROOM_EDITOR_NAME',
    role: 'section_editor',
  },
  {
    emailKey: 'NEWSROOM_REPORTER_EMAIL',
    passwordKey: 'NEWSROOM_REPORTER_PASSWORD',
    nameKey: 'NEWSROOM_REPORTER_NAME',
    role: 'journalist',
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
  /** Exact env emails for the staff login screen (not for public surfaces). */
  emails: string[]
  maskedEmails: string[]
  provisionedCount: number
  lastError: string | null
}

export type BootProvisionOptions = {
  /** Re-hash and write env passwords even if this instance already synced them. */
  forcePassword?: boolean
}

let lastProvisionError: string | null = null
let provisionPromise: Promise<BootProvisionResult> | null = null
const passwordSyncedThisProcess = new Set<string>()

const ROLE_RANK: Record<string, number> = { admin: 1, super_admin: 2 }

type ConfiguredBootAccountSpec = BootAccountSpec & {
  email: string
  password: string
  displayName: string
}

function configuredSpecs(): ConfiguredBootAccountSpec[] {
  const specs = BOOT_SPECS.flatMap((spec) => {
    const email = process.env[spec.emailKey]?.trim().toLowerCase()
    const password = process.env[spec.passwordKey]?.trim()
    if (!email || !password) return []
    const displayName =
      process.env[spec.nameKey]?.trim() || email.split('@')[0] || 'Newsroom account'
    return [{ ...spec, email, password, displayName }]
  })

  // Same email in SUPERADMIN + ADMIN must not demote super_admin → admin.
  const byEmail = new Map<string, ConfiguredBootAccountSpec>()
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

async function withPool<T>(fn: (pool: Queryable) => Promise<T>): Promise<T> {
  const shared = await getSharedPool()
  if (shared) return fn(shared as unknown as Queryable)
  const pglite = await getAuthPgliteQueryable()
  if (pglite) return fn(pglite as unknown as Queryable)
  throw new Error('No auth database available for boot account provisioning.')
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

async function createUserRow(spec: ConfiguredBootAccountSpec): Promise<string> {
  const id = randomUUID()
  const name = spec.displayName
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
        sql: `UPDATE "user"
              SET role = $1,
                  "displayName" = CASE
                    WHEN "displayName" IS NULL
                      OR btrim("displayName") = ''
                      OR "displayName" IN ('मुख्य एडमिन', 'एडमिन')
                    THEN $2
                    ELSE "displayName"
                  END
              WHERE lower(email) = lower($3)`,
        params: [role, displayName, email],
      },
      {
        sql: `UPDATE "user"
              SET role = $1,
                  display_name = CASE
                    WHEN display_name IS NULL
                      OR btrim(display_name) = ''
                      OR display_name IN ('मुख्य एडमिन', 'एडमिन')
                    THEN $2
                    ELSE display_name
                  END
              WHERE lower(email) = lower($3)`,
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

async function normalizeUserEmail(userId: string, email: string): Promise<void> {
  await withPool(async (pool) => {
    for (const sql of [
      `UPDATE "user" SET email = $1 WHERE id = $2 AND email <> $1`,
      `UPDATE "user" SET email = $1 WHERE id = $2 AND email <> $1`,
    ]) {
      try {
        await pool.query(sql, [email, userId])
        return
      } catch {
        // next
      }
    }
  })
}

async function syncCredentialPassword(
  userId: string,
  _email: string,
  password: string,
): Promise<boolean> {
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
        `UPDATE account SET password = $1, "updatedAt" = $2, "accountId" = $3 WHERE id = $4`,
        `UPDATE account SET password = $1, updated_at = $2, account_id = $3 WHERE id = $4`,
      ]) {
        try {
          const result = await pool.query(sql, [hashed, now, userId, existingId])
          if (Number(result.rowCount ?? 0) > 0) return true
        } catch {
          // Fall back to password-only update if accountId column shape differs.
        }
      }
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

    // Better Auth sign-up uses accountId = userId for credential accounts.
    for (const sql of [
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1,$2,'credential',$3,$4,$5,$6)`,
      `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
       VALUES ($1,$2,'credential',$3,$4,$5,$6)`,
    ]) {
      try {
        await pool.query(sql, [randomUUID(), userId, userId, hashed, now, now])
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
  spec: ConfiguredBootAccountSpec,
  options?: BootProvisionOptions,
): Promise<'created' | 'synced'> {
  let userId = await findUserId(spec.email)
  let created = false

  if (!userId) {
    try {
      await auth.api.signUpEmail({
        body: {
          email: spec.email,
          password: spec.password,
          name: spec.displayName,
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

  await normalizeUserEmail(userId, spec.email)

  // Password sync is expensive (bcrypt). Do it for new users, once per warm
  // instance (so env password repairs work), when AUTH_BOOT_SYNC_PASSWORD=true,
  // or when a staff login page explicitly requests a repair.
  const forceSync =
    options?.forcePassword === true || process.env.AUTH_BOOT_SYNC_PASSWORD === 'true'
  const alreadySynced = passwordSyncedThisProcess.has(spec.email)
  if (created || forceSync || !alreadySynced) {
    const passwordOk = await syncCredentialPassword(userId, spec.email, spec.password)
    if (!passwordOk) throw new Error(`Could not sync password for ${spec.email}.`)
    passwordSyncedThisProcess.add(spec.email)
  }

  const roleOk = await assignBootRole(spec.email, spec.role, spec.displayName)
  if (!roleOk) throw new Error(`Could not assign ${spec.role} to ${spec.email}.`)

  console.info(
    `[auth] boot account ${created ? 'created' : 'synced'}: ${maskEmail(spec.email)} as ${spec.role}`,
  )
  return created ? 'created' : 'synced'
}

/**
 * Provision / repair newsroom boot accounts from env.
 * Soft-fails: logs errors but never blocks Better Auth from serving sign-in.
 * Successful provision is cached for the warm instance; failures retry next call.
 * Pass `{ forcePassword: true }` from staff login so env passwords always win.
 */
export async function ensureNewsroomBootAccounts(
  auth: AuthApi,
  options?: BootProvisionOptions,
): Promise<BootProvisionResult> {
  if (options?.forcePassword) {
    provisionPromise = null
    passwordSyncedThisProcess.clear()
  }
  if (provisionPromise) return provisionPromise

  const run = (async (): Promise<BootProvisionResult> => {
    const specs = configuredSpecs()
    const result: BootProvisionResult = {
      configured: specs.length,
      created: [],
      synced: [],
      failed: [],
    }
    if (specs.length === 0) {
      lastProvisionError =
        'NEWSROOM_SUPERADMIN_EMAIL/PASSWORD (or ADMIN pair) is not set in Vercel.'
      console.error('[auth]', lastProvisionError)
      provisionPromise = null
      return result
    }

    for (const spec of specs) {
      try {
        const status = await seedOne(auth, spec, options)
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

    // Cache only full success so a cold env fix can retry without redeploy.
    if (result.failed.length > 0) {
      provisionPromise = null
    }
    return result
  })().catch((error) => {
    provisionPromise = null
    throw error
  })

  provisionPromise = run
  return run
}

/** Cheap login hint — env check only (no per-email DB round-trips). */
export async function getBootLoginHint(): Promise<BootLoginHint> {
  const specs = configuredSpecs()
  return {
    configured: specs.length > 0,
    emails: specs.map((spec) => spec.email),
    maskedEmails: specs.map((spec) => maskEmail(spec.email)),
    provisionedCount: specs.length,
    lastError: lastProvisionError,
  }
}
