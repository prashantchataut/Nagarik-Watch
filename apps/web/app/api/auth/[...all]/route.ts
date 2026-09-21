import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '@/lib/auth'
import { clientIp } from '@/lib/rate-limit'
import { evaluateSignIn, recordAuthAttempt } from '@/lib/security/auth-attempts'
import { STUFFING_BLOCK_MESSAGE_NE } from '@/lib/security/credential-stuffing'

/**
 * Better Auth owns the sign-in itself. What is added around it is the
 * credential-stuffing ledger: every sign-in attempt is scored against the
 * shared 15-minute window before it runs, and its outcome is written back
 * after. The rate limiter cannot do this job — a spray stays under every
 * per-key limit by design.
 */

/** Only the sign-in endpoints; sessions, callbacks and sign-out are untouched. */
function signInIdentifierPath(request: Request): boolean {
  return request.method === 'POST' && new URL(request.url).pathname.includes('/sign-in/')
}

/** The submitted username, for the ledger only — it is hashed before storage. */
async function readIdentifier(request: Request): Promise<string | null> {
  try {
    const body = (await request.clone().json()) as Record<string, unknown>
    const value = body.email ?? body.username ?? body.identifier
    return typeof value === 'string' && value.trim() ? value.trim() : null
  } catch {
    return null
  }
}

async function handler(request: Request) {
  const tracked = signInIdentifierPath(request)
  const identifier = tracked ? await readIdentifier(request) : null
  const ip = clientIp(request)

  if (identifier) {
    const signal = await evaluateSignIn(ip, identifier)
    if (signal?.verdict === 'block') {
      // Logged with the reasons so the security desk can see what fired; the
      // response says nothing an attacker could tune against.
      console.warn(
        `[auth] refused sign-in: credential-stuffing score ${signal.score.toFixed(2)} (${signal.reasons.join(', ')})`,
      )
      await recordAuthAttempt(ip, identifier, 'failure')
      return Response.json(
        { error: { code: 'SUSPICIOUS_SIGN_IN', message: STUFFING_BLOCK_MESSAGE_NE } },
        { status: 429, headers: { 'cache-control': 'no-store', 'retry-after': '900' } },
      )
    }
  }

  try {
    const auth = await getAuth()
    const handlers = toNextJsHandler(auth)
    const response =
      request.method === 'GET' ? await handlers.GET(request) : await handlers.POST(request)
    if (identifier) {
      await recordAuthAttempt(ip, identifier, response.ok ? 'success' : 'failure')
    }
    return response
  } catch (error) {
    console.error('[auth] request failed', error)
    return Response.json(
      {
        error: {
          code: 'AUTH_UNAVAILABLE',
          message:
            'Authentication is temporarily unavailable. The account database could not be reached — check DATABASE_URL and that Postgres is online.',
        },
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}

export const GET = handler
export const POST = handler
