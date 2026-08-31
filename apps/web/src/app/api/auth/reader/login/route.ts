import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'
import { limitOr429 } from '@/lib/api'

export async function POST(req: Request) {
  const limited = limitOr429(req, 'login-reader', 10, 5 * 60 * 1000)
  if (limited) return limited

  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const reader = await db.reader.findUnique({ where: { email } })
    if (!reader || !verifyPassword(password, reader.passwordHash)) {
      return NextResponse.json({ error: 'इमेल वा पासवर्ड मिलेन।' }, { status: 401 })
    }
    await createSession('reader', reader.id)
    return NextResponse.json({ ok: true, kind: 'reader', profile: { name: reader.name, email: reader.email } })
  } catch {
    return NextResponse.json({ error: 'लगइन गर्न सकिएन। पुनः प्रयास गर्नुहोस्।' }, { status: 500 })
  }
}
