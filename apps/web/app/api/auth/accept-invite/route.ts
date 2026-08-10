import { type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { acceptNewsroomInvite } from '@/lib/newsroom-users'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return Response.json({ error: 'Untrusted request origin.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'accept-newsroom-invite', 10, 60_000)
  if (limited) return limited
  const session = await getSession()
  if (!session)
    return Response.json({ error: 'Sign in before accepting the invitation.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { token?: unknown }
  const result = await acceptNewsroomInvite({ token: body.token, email: session.email })
  if (!result.ok) {
    const status =
      result.reason === 'email_mismatch' ? 403 : result.reason === 'account_missing' ? 409 : 400
    return Response.json({ error: result.reason }, { status })
  }
  return Response.json(
    { ok: true, role: result.role },
    { headers: { 'cache-control': 'no-store' } },
  )
}
