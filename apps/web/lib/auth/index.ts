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
import { APIError, betterAuth } from 'better-auth'
import { after } from 'next/server'
import { createDialect } from './auth-pool'
import { SITE_URL } from '@/lib/site'
import { sendEmail } from '@/lib/email-provider'
import { isUserDisabledById } from './disabled-users'
import { ensureNewsroomBootAccounts } from './boot-accounts'

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
    database: { dialect, type: 'postgres' },
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
        // Admin panel can disable accounts. Never accept from client signup.
        disabled: {
          type: 'boolean',
          required: false,
          defaultValue: false,
          input: false,
        },
      },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            if (await isUserDisabledById(session.userId)) {
              throw new APIError('FORBIDDEN', {
                message: 'This account has been disabled by the newsroom.',
                code: 'ACCOUNT_DISABLED',
              })
            }
          },
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

  await ensureNewsroomBootAccounts(auth as unknown as Parameters<typeof ensureNewsroomBootAccounts>[0])
  return auth
}

export type Session = Awaited<ReturnType<AuthInstance['api']['getSession']>>
