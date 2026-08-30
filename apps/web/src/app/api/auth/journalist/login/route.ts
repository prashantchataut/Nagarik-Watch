import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'

/**
 * Journalist login — deliberately separate from reader login.
 * Only active journalist accounts can enter the newsroom desk.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const journalist = await db.journalist.findUnique({ where: { email } })
    if (!journalist || !journalist.active || !verifyPassword(password, journalist.passwordHash)) {
      return NextResponse.json(
        { error: 'पत्रकार खाता भेटिएन वा पासवर्ड मिलेन।' },
        { status: 401 },
      )
    }
    await createSession('journalist', journalist.id)
    return NextResponse.json({
      ok: true,
      kind: 'journalist',
      profile: { name: journalist.name, email: journalist.email, desk: journalist.desk, bio: journalist.bio },
    })
  } catch {
    return NextResponse.json({ error: 'लगइन गर्न सकिएन। पुनः प्रयास गर्नुहोस्।' }, { status: 500 })
  }
}
