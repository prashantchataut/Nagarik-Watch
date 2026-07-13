import { NextResponse, type NextRequest } from 'next/server'
import { createContactMessage } from '@/lib/contact-messages'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'contact', 5, 60 * 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (String(body.website ?? '').trim()) {
    return NextResponse.json({ ok: true }, { status: 202 })
  }

  try {
    const message = await createContactMessage({
      name: body.name,
      email: body.email,
      subject: body.subject,
      message: body.message,
      locale: body.locale,
    })
    return NextResponse.json({ ok: true, id: message.id }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Contact message could not be saved' },
      { status: 400 },
    )
  }
}
