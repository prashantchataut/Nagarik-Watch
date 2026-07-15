import 'server-only'
import { randomUUID } from 'node:crypto'
import { Kysely } from 'kysely'
import { hashPassword } from 'better-auth/crypto'
import { createDialect } from './auth-pool'

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

function configuredSpecs(): Array<BootAccountSpec & { email: string; password: string }> {
  return BOOT_SPECS.flatMap((spec) => {
    const email = process.env[spec.emailKey]?.trim().toLowerCase()
    const password = process.env[spec.passwordKey]
    if (!email || !password) return []
    return [{ ...spec, email, password }]
  })
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  const keep = local.slice(0, Math.min(2, local.length))
  return `${keep}***@${domain}`
}

async function withUserDb<T>(fn: (db: Kysely<{ user: Record<string, unknown>; account: Record<string, unknown> }>) => Promise<T>): Promise<T> {
  const dialect = await createDialect()
  const db = new Kysely<{ user: Record<string, unknown>; account: Record<string, unknown> }>({ dialect })
  return fn(db)
}

async function findUserId(email: string): Promise<string | null> {
  return withUserDb(async (db) => {
    const row = await db
      .selectFrom('user')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst()
    return row?.id ? String(row.id) : null
  })
}

async function assignBootRole(email: string, role: string, displayName: string): Promise<boolean> {
  return withUserDb(async (db) => {
    const result = await db
      .updateTable('user')
      .set({ role, displayName })
      .where('email', '=', email)
      .executeTakeFirst()
    return Number(result.numUpdatedRows ?? 0) > 0
  })
}

async function syncCredentialPassword(userId: string, email: string, password: string): Promise<boolean> {
  const hashed = await hashPassword(password)
  return withUserDb(async (db) => {
    const existing = await db
      .selectFrom('account')
      .select('id')
      .where('userId', '=', userId)
      .where('providerId', '=', 'credential')
      .executeTakeFirst()

    if (existing?.id) {
      const result = await db
        .updateTable('account')
        .set({ password: hashed })
        .where('id', '=', String(existing.id))
        .executeTakeFirst()
      return Number(result.numUpdatedRows ?? 0) > 0
    }

    await db
      .insertInto('account')
      .values({
        id: randomUUID(),
        accountId: email,
        providerId: 'credential',
        userId,
        password: hashed,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .execute()
    return true
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
    } catch (error) {
      userId = await findUserId(spec.email)
      if (!userId) {
        throw new Error(`Could not create boot account ${spec.email}`, { cause: error })
      }
    }
    userId = await findUserId(spec.email)
  }

  if (!userId) throw new Error(`Boot account ${spec.email} is missing after signup.`)

  const passwordOk = await syncCredentialPassword(userId, spec.email, spec.password)
  if (!passwordOk) throw new Error(`Could not sync password for ${spec.email}.`)

  const roleOk = await assignBootRole(spec.email, spec.role, spec.displayName)
  if (!roleOk) throw new Error(`Could not assign ${spec.role} to ${spec.email}.`)

  return created ? 'created' : 'synced'
}

/**
 * Provision / repair newsroom boot accounts from env.
 * Soft-fails: logs errors but never blocks Better Auth from serving sign-in.
 * Also syncs env passwords every cold start so a powered-off Aiven restore
 * cannot leave operators with a dead credential that still "looks" configured.
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
      return result
    })().finally(() => {
      // Allow a later request to retry after a transient Aiven blip.
      provisionPromise = null
    })
  }
  return provisionPromise
}

export async function getBootLoginHint(): Promise<BootLoginHint> {
  const specs = configuredSpecs()
  let provisionedCount = 0
  for (const spec of specs) {
    if (await findUserId(spec.email).catch(() => null)) provisionedCount += 1
  }
  return {
    configured: specs.length > 0,
    maskedEmails: specs.map((spec) => maskEmail(spec.email)),
    provisionedCount,
    lastError: lastProvisionError,
  }
}
