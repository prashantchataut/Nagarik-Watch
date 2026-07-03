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
import { createDialect } from './auth-pool'

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  'dev-only-secret-change-me-please-32-chars-minimum'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

type AuthInstance = ReturnType<typeof betterAuth>

let authPromise: Promise<AuthInstance> | null = null

export function getAuth(): Promise<AuthInstance> {
  if (!authPromise) authPromise = buildAuth()
  return authPromise
}

async function buildAuth(): Promise<AuthInstance> {
  const dialect = await createDialect()
  const auth = betterAuth({
    secret: AUTH_SECRET,
    baseURL: SITE_URL,
    trustedOrigins: [SITE_URL],
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
        // `input: true` so the founder bootstrap (seedFounderAccount) can set
        // role='super_admin' at sign-up. Public reader sign-ups never send a
        // role, so they fall through to the 'reader' default — the field is
        // only privileged on the server, never exposed in the reader form.
        role: {
          type: 'string',
          required: false,
          defaultValue: 'reader',
          input: true,
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

  // Seed the founder accounts from env on first boot. Fire-and-forget:
  // getAuth() must resolve to the auth instance immediately so requests can
  // be served, while the seeds run in the background. Duplicate seeds are
  // no-ops (email conflict → skip). See MANUAL.md "First boot".
  void seedBootAccounts(auth).catch(() => {
    // Swallowed: a failed seed must never block auth from serving requests.
  })

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
        role,
        displayName,
      },
    })
  } catch {
    // Account already exists, or adapter not ready yet. Either way, no-op.
  }
}

export type Session = Awaited<ReturnType<AuthInstance['api']['getSession']>>
