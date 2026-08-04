import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/** Shared Bearer check for Vercel cron / ops job routes. Timing-safe; secret ≥ 32. */
export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || secret.length < 32) return false
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  return safeEqualString(header.slice(7), secret)
}
