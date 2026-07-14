/**
 * Auth configuration for Nagarik Watch.
 *
 * Two surfaces share this module:
 *   1. Newsroom staff — `/admin/login`, gated by role. Accounts are provisioned
 *      via env (NEWSROOM_ADMIN_EMAIL/PASSWORD) or via the Users admin screen.
 *   2. Readers — `/auth/signup`, `/auth/login`, `/auth/profile`. Email +
 *      password via Better Auth. Reader accounts drive bookmarks, history,
 *      comments, and poll votes.
 *
 * The database dialect is chosen at boot: Postgres when DATABASE_URL is set
 * (production, shared with Payload), or a filesystem-backed PGlite database in
 * local development. Production refuses an ephemeral authentication database.
 *
 * Secrets: AUTH_SECRET (32+ chars) signs sessions. BETTER_AUTH_SECRET is
 * accepted as an alias for compatibility with the existing .env.example.
 *
 * Because PGlite initialisation is async, the auth instance is created lazily
 * via getAuth(). Callers await it once; the singleton is cached.
 */
import 'server-only'
import { betterAuth } from 'better-auth'
import { after } from 'next/server'
import { Kysely } from 'kysely'
import { createDialect } from './auth-pool'
import { SITE_URL } from '@/lib/site'
import { sendEmail } from '@/lib/email-provider'

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET

const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
if (
  !isBuild &&
  process.env.NODE_ENV === 'production' &&
  (!AUTH_SECRET || AUTH_SECRET.length < 32)
) {
  throw new Error(
    'AUTH_SECRET or BETTER_AUTH_SECRET with at least 32 characters is required in production.',
  )
}

const EFFECTIVE_AUTH_SECRET = AUTH_SECRET ?? 'local-dev-auth-secret-change-before-production-32'

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null
  const withProtocol =
    raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

function authBaseUrl(): string {
  return normalizeOrigin(process.env.BETTER_AUTH_URL) ?? SITE_URL
}

function trustedOrigins(): string[] {
  const candidates = [
    SITE_URL,
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000']),
  ]
  return Array.from(
    new Set(
      candidates
        .map((value) => normalizeOrigin(value))
        .filter((value): value is string => Boolean(value)),
    ),
  )
}

function escapeEmailHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character] ?? character
  })
}

type AuthInstance = ReturnType<typeof betterAuth>

let authPromise: Promise<AuthInstance> | null = null

export function getAuth(): Promise<AuthInstance> {
  if (!authPromise) {
    authPromise = buildAuth().catch((error) => {
      // Allow a later request to recover after a transient database failure.
      authPromise = null
      throw error
    })
  }
  return authPromise
}

async function buildAuth(): Promise<AuthInstance> {
  const dialect = await createDialect()
  const auth = betterAuth({
    secret: EFFECTIVE_AUTH_SECRET,
    baseURL: authBaseUrl(),
    trustedOrigins: trustedOrigins(),
    database: { dialect },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 30,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        // Better Auth deliberately does not reveal whether an account exists.
        // Schedule delivery after the HTTP response so a slow provider does not
        // turn account recovery into a timing oracle or a serverless timeout.
        after(async () => {
          const displayName = user.name?.trim() || user.email.split('@')[0] || 'पाठक'
          try {
            await sendEmail({
              to: user.email,
              from: process.env.AUTH_EMAIL_FROM?.trim() || undefined,
              subject: 'नागरिक वाच पासवर्ड पुनः सेट गर्नुहोस्',
              text: [
                `${displayName},`,
                '',
                'तपाईंले नागरिक वाच खाताको पासवर्ड परिवर्तन गर्न अनुरोध गर्नुभएको छ।',
                `नयाँ पासवर्ड बनाउन यो सुरक्षित लिंक खोल्नुहोस्: ${url}`,
                '',
                'यो लिंक ३० मिनेटसम्म मात्र मान्य हुन्छ। तपाईंले यो अनुरोध नगर्नुभएको हो भने यस इमेललाई बेवास्ता गर्नुहोस्।',
                '',
                '— नागरिक वाच',
              ].join('\n'),
              html: `<p>${escapeEmailHtml(displayName)},</p><p>तपाईंले नागरिक वाच खाताको पासवर्ड परिवर्तन गर्न अनुरोध गर्नुभएको छ।</p><p><a href="${escapeEmailHtml(url)}">नयाँ पासवर्ड बनाउनुहोस्</a></p><p>यो लिंक ३० मिनेटसम्म मात्र मान्य हुन्छ। तपाईंले यो अनुरोध नगर्नुभएको हो भने यस इमेललाई बेवास्ता गर्नुहोस्।</p><p>— नागरिक वाच</p>`,
            })
          } catch (error) {
            console.error('[auth] password reset email delivery failed', {
              userId: user.id,
              error,
            })
          }
        })
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    user: {
      additionalFields: {
        // Never accept role from public sign-up payloads. Founder/admin boot
        // accounts are promoted after creation by seedOne() via a server-only
        // SQL update, so clients cannot self-escalate by posting role fields.
        role: {
          type: 'string',
          required: false,
          defaultValue: 'reader',
          input: false,
        },
        displayName: {
          type: 'string',
          required: false,
          input: true,
        },
        locale: {
          type: 'string',
          required: false,
          defaultValue: 'ne',
          input: true,
        },
      },
    },
    advanced: {
      ipAddress: {
        // Trust only single-value headers set by the CDN/origin proxy. Do not
        // accept a client-controlled comma-separated X-Forwarded-For chain.
        ipAddressHeaders: ['cf-connecting-ip', 'x-real-ip'],
      },
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
      useSecureCookies: process.env.NODE_ENV === 'production',
    },
    rateLimit: {
      enabled: process.env.NODE_ENV === 'production',
      window: 60,
      max: 20,
      storage: 'database',
      modelName: 'rateLimit',
    },
  }) as unknown as AuthInstance

  if (process.env.AUTH_AUTO_MIGRATE !== 'false') {
    const { getMigrations } = await import('better-auth/db/migration')
    const { runMigrations } = await getMigrations(auth.options)
    await runMigrations()
  }

  await seedBootAccounts(auth)
  return auth
}

/**
 * Provision the newsroom leadership from env at first boot. Two accounts:
 *
 *   NEWSROOM_SUPERADMIN_EMAIL / NEWSROOM_SUPERADMIN_PASSWORD → role 'super_admin'
 *   NEWSROOM_ADMIN_EMAIL      / NEWSROOM_ADMIN_PASSWORD      → role 'admin'
 *
 * (The legacy single-pair NEWSROOM_ADMIN_EMAIL/PASSWORD still maps to
 * 'super_admin' for backward compatibility with earlier .env.example docs —
 * see BOOT_ACCOUNTS below.)
 *
 * Runs once per process boot; if an account already exists (subsequent boots,
 * or a multi-instance warm-up), Better Auth returns a conflict and we skip
 * that account. Without this seeding there is no path to a newsroom role:
 * signup only ever sets role='reader' and requireNewsroomSession() rejects
 * readers, so /admin/* would be permanently locked.
 */
async function seedBootAccounts(auth: AuthInstance): Promise<void> {
  const bootAccounts: Array<[string, string, string, string]> = [
    ['NEWSROOM_SUPERADMIN_EMAIL', 'NEWSROOM_SUPERADMIN_PASSWORD', 'super_admin', 'मुख्य एडमिन'],
    ['NEWSROOM_ADMIN_EMAIL', 'NEWSROOM_ADMIN_PASSWORD', 'admin', 'एडमिन'],
  ]
  const configured = bootAccounts.filter(([emailKey, passwordKey]) =>
    Boolean(process.env[emailKey]?.trim() && process.env[passwordKey]),
  )
  if (configured.length === 0) return

  const results = await Promise.allSettled(
    configured.map(([emailKey, passwordKey, role, displayName]) =>
      seedOne(auth, emailKey, passwordKey, role, displayName),
    ),
  )
  const failures = results
    .map((result, index) => ({ result, account: configured[index] }))
    .filter((entry): entry is { result: PromiseRejectedResult; account: [string, string, string, string] } =>
      entry.result.status === 'rejected',
    )
  if (failures.length > 0) {
    for (const failure of failures) {
      const email = process.env[failure.account[0]] ?? failure.account[0]
      console.error(`[auth] boot account provisioning failed for ${email}`, failure.result.reason)
    }
    throw new AggregateError(
      failures.map((failure) => failure.result.reason),
      'Configured newsroom boot accounts could not be provisioned.',
    )
  }
}

async function seedOne(
  auth: AuthInstance,
  emailKey: string,
  passwordKey: string,
  role: string,
  displayName: string,
): Promise<void> {
  const email = process.env[emailKey]?.trim().toLowerCase()
  const password = process.env[passwordKey]
  if (!email || !password) return

  try {
    const signUp = auth.api.signUpEmail as unknown as (args: {
      body: Record<string, unknown>
    }) => Promise<unknown>
    await signUp({
      body: {
        email,
        password,
        name: process.env[`${emailKey.replace('_EMAIL', '')}_NAME`]?.trim() || email.split('@')[0] || 'Newsroom',
        displayName,
      },
    })
  } catch (error) {
    if (!(await bootUserExists(email))) {
      throw new Error(`Could not create configured boot account ${email}.`, { cause: error })
    }
  }

  const assigned = await assignBootRole(email, role, displayName)
  if (!assigned) throw new Error(`Could not assign ${role} to configured boot account ${email}.`)
}

async function bootUserExists(email: string): Promise<boolean> {
  const dialect = await createDialect()
  const db = new Kysely<{ user: Record<string, unknown> }>({ dialect })
  const row = await db.selectFrom('user').select('id').where('email', '=', email).executeTakeFirst()
  return Boolean(row)
}

async function assignBootRole(email: string, role: string, displayName: string): Promise<boolean> {
  const dialect = await createDialect()
  const db = new Kysely<{ user: Record<string, unknown> }>({ dialect })
  const result = await db
    .updateTable('user')
    .set({ role, displayName })
    .where('email', '=', email)
    .executeTakeFirst()
  return Number(result.numUpdatedRows ?? 0) > 0
}

export type Session = Awaited<ReturnType<AuthInstance['api']['getSession']>>
