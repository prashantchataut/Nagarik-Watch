import 'server-only'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const SESSION_COOKIE = 'nw_session'
const SESSION_DAYS = 30

/* ---------- password hashing (node:crypto scrypt — no external deps) ---------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}

/* ---------- sessions ---------- */

export async function createSession(kind: 'reader' | 'journalist', id: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000)
  if (kind === 'reader') {
    await db.session.create({ data: { token, kind, readerId: id, expiresAt } })
  } else {
    await db.session.create({ data: { token, kind, journalistId: id, expiresAt } })
  }
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 3600,
    path: '/',
  })
  return token
}

export type Me =
  | { kind: 'reader'; id: string; name: string; email: string }
  | {
      kind: 'journalist'
      id: string
      name: string
      email: string
      desk: string
      role: string // "reporter" | "editor"
      bio: string | null
    }
  | null

export async function currentUser(): Promise<Me> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { token },
    include: { reader: true, journalist: true },
  })
  if (!session || session.expiresAt < new Date()) return null
  if (session.kind === 'reader' && session.reader) {
    return { kind: 'reader', id: session.reader.id, name: session.reader.name, email: session.reader.email }
  }
  if (session.kind === 'journalist' && session.journalist) {
    return {
      kind: 'journalist',
      id: session.journalist.id,
      name: session.journalist.name,
      email: session.journalist.email,
      desk: session.journalist.desk,
      role: session.journalist.role,
      bio: session.journalist.bio,
    }
  }
  return null
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await db.session.deleteMany({ where: { token } })
  }
  jar.delete(SESSION_COOKIE)
}

/* ---------- validation helpers ---------- */

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

export function validPassword(password: string): string | null {
  if (password.length < 6) return 'पासवर्ड कम्तीमा ६ अक्षरको हुनुपर्छ।'
  return null
}

// Re-export better-auth instance for routes that import from '@/lib/auth'.
// The canonical implementation lives in apps/web/lib/auth/index.ts (Better Auth + Aiven).
// src/lib/auth.ts is the simple session helper; this re-export makes `@/lib/auth` resolve
// correctly regardless of whether tsconfig prefers src/* or lib/*.
export { getAuth } from '../../lib/auth/index'
