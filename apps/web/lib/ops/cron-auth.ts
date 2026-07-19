import type { NextRequest } from 'next/server'

/** Shared Bearer check for Vercel cron / ops job routes. */
export function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || secret.length < 24) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}
