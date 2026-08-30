import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, hashPassword, validEmail, validPassword } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; password?: string }
    const name = (body.name ?? '').trim()
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    if (name.length < 2) {
      return NextResponse.json({ error: 'कृपया पूरा नाम लेख्नुहोस्।' }, { status: 400 })
    }
    if (!validEmail(email)) {
      return NextResponse.json({ error: 'इमेल ठेगाना मान्य छैन।' }, { status: 400 })
    }
    const pwError = validPassword(password)
    if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

    const existing = await db.reader.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'यो इमेल पहिले नै दर्ता भइसकेको छ — लगइन गर्नुहोस्।' }, { status: 409 })
    }

    const reader = await db.reader.create({
      data: { name, email, passwordHash: hashPassword(password) },
    })
    await createSession('reader', reader.id)
    return NextResponse.json({ ok: true, kind: 'reader', profile: { name: reader.name, email: reader.email } })
  } catch {
    return NextResponse.json({ error: 'दर्ता पूरा गर्न सकिएन। पुनः प्रयास गर्नुहोस्।' }, { status: 500 })
  }
}
