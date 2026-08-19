import { createHmac, timingSafeEqual } from 'node:crypto'

export const REVALIDATE_MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

export function isValidRevalidateSignature(
  body: string,
  timestamp: string,
  received: string,
  secret: string,
  now = Date.now(),
): boolean {
  if (!secret || secret.length < 32) return false
  if (!/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(received)) return false
  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt) || Math.abs(now - sentAt) > REVALIDATE_MAX_CLOCK_SKEW_MS) {
    return false
  }

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}
