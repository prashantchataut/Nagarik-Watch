import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import {
  getReaderPreferences,
  mergeAnonymousPreferences,
  sanitizeReaderPreferenceInput,
  saveReaderPreferences,
} from '@/lib/reader/preferences-store'

export const dynamic = 'force-dynamic'

function fingerprint(request: NextRequest) {
  return request.nextUrl.searchParams.get('fingerprint')?.trim() ?? ''
}

export async function GET(request: NextRequest) {
  const fp = fingerprint(request)
  const session = await getSession().catch(() => null)
  if (!session && !fp)
    return NextResponse.json({ error: 'Reader identity required.' }, { status: 400 })
  if (fp.length > 160)
    return NextResponse.json({ error: 'Invalid reader identifier.' }, { status: 400 })
  if (session && fp) await mergeAnonymousPreferences(fp, session.userId)
  return NextResponse.json({ preferences: await getReaderPreferences(fp, session?.userId) })
}

export async function PUT(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'reader-preferences', 20, 60_000)
  if (limited) return limited
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const fp = String(body.fingerprint ?? '').trim()
  const session = await getSession().catch(() => null)
  if ((!session && !fp) || fp.length > 160) {
    return NextResponse.json({ error: 'Reader identity required.' }, { status: 400 })
  }
  if (session && fp) await mergeAnonymousPreferences(fp, session.userId)
  const preferences = await saveReaderPreferences(
    fp,
    session?.userId,
    sanitizeReaderPreferenceInput(body),
  )
  return NextResponse.json({ preferences })
}
