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
 * (production, shared with Payload), PGlite (in-memory Postgres via WASM) when
 * not. Both speak real SQL, so Better Auth's schema + queries are identical.
 *
 * Secrets: AUTH_SECRET (32+ chars) signs sessions. BETTER_AUTH_SECRET is
 * accepted as an alias for compatibility with the existing .env.example.
 *
 * Because PGlite initialisation is async, the auth instance is created lazily
 * via getAuth(). Callers await it once; the singleton is cached.
 */
import 'server-only'
import { betterAuth } from 'better-auth'
import { Kysely } from 'kysely'
import { createDialect } from './auth-pool'
import { SITE_URL } from '@/lib/site'

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

type AuthInstance = ReturnType<typeof betterAuth>

let authPromise: Promise<AuthInstance> | null = null

export function getAuth(): Promise<AuthInstance> {
  if (!authPromise) authPromise = buildAuth()
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
      crossSubDomainCookies: { enabled: false },
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      },
      useSecureCookies: process.env.NODE_ENV === 'production',
    },
    rateLimit: {
      window: 60,
      max: 20,
      storage: 'memory',
    },
  }) as unknown as AuthInstance

  // Seed founder accounts before returning the auth singleton. This removes the
  // login race where /admin/login is submitted before the boot accounts exist.
  // If the database is down, surface the boot problem instead of silently
  // pretending admin login works.
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
  // Each entry: [emailEnv, passwordEnv, role, displayNameNe]. Processed in
  // order; the first matching env pair wins for a given email.
  const BOOT_ACCOUNTS: Array<[string, string, string, string]> = [
    ['NEWSROOM_SUPERADMIN_EMAIL', 'NEWSROOM_SUPERADMIN_PASSWORD', 'super_admin', 'मुख्य एडमिन'],
    ['NEWSROOM_ADMIN_EMAIL', 'NEWSROOM_ADMIN_PASSWORD', 'admin', 'एडमिन'],
  ]

  await Promise.all(
    BOOT_ACCOUNTS.map(([emailKey, pwKey, role, displayName]) =>
      seedOne(auth, emailKey, pwKey, role, displayName),
    ),
  )
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
    // Better Auth's email/password sign-up. On conflict (account exists) it
    // rejects — we treat that as success and move on. The static body type
    // doesn't include additionalFields (role/displayName), but they ARE
    // persisted because we declared them input:true above — hence the cast.
    const signUp = auth.api.signUpEmail as unknown as (args: {
      body: Record<string, unknown>
    }) => Promise<unknown>
    await signUp({
      body: {
        email,
        password,
        name: email.split('@')[0] ?? 'Newsroom',
        displayName,
      },
    })
  } catch {
    // Account already exists, or adapter not ready yet. Either way, attempt the
    // role update below so existing boot users stay aligned with env.
  }

  await assignBootRole(email, role, displayName)
}

async function assignBootRole(email: string, role: string, displayName: string): Promise<void> {
  const dialect = await createDialect()
  const db = new Kysely<{ user: Record<string, unknown> }>({ dialect })
  await db
    .updateTable('user')
    .set({ role, displayName })
    .where('email', '=', email)
    .executeTakeFirst()
}

export type Session = Awaited<ReturnType<AuthInstance['api']['getSession']>>
