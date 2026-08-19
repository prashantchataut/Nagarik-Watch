import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { isValidRevalidateSignature } from './revalidate-signature'

const secret = 'revalidate-secret-with-32-chars!!'

function sign(body: string, timestamp: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
}

describe('isValidRevalidateSignature', () => {
  it('accepts a timely HMAC of timestamp.body', () => {
    const body = '{"event":"article.changed"}'
    const timestamp = String(Date.now())
    expect(isValidRevalidateSignature(body, timestamp, sign(body, timestamp), secret)).toBe(true)
  })

  it('rejects a missing or short secret', () => {
    expect(isValidRevalidateSignature('{}', String(Date.now()), 'ab'.repeat(32), 'short')).toBe(
      false,
    )
  })

  it('rejects an expired timestamp', () => {
    const body = '{}'
    const timestamp = String(Date.now() - 10 * 60 * 1000)
    expect(isValidRevalidateSignature(body, timestamp, sign(body, timestamp), secret)).toBe(false)
  })

  it('rejects a tampered body', () => {
    const timestamp = String(Date.now())
    const signature = sign('{"event":"article.changed"}', timestamp)
    expect(isValidRevalidateSignature('{"event":"other"}', timestamp, signature, secret)).toBe(
      false,
    )
  })
})
