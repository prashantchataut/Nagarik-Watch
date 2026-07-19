import { afterEach, describe, expect, it } from 'vitest'
import { isPublicMembershipEnabled } from './membership'

const ORIGINAL = process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC
  else process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC = ORIGINAL
})

describe('isPublicMembershipEnabled', () => {
  it('is false by default (Option A: free + ads)', () => {
    delete process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC
    expect(isPublicMembershipEnabled()).toBe(false)
  })

  it('is true only when explicitly enabled', () => {
    process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC = 'true'
    expect(isPublicMembershipEnabled()).toBe(true)
    process.env.NEXT_PUBLIC_MEMBERSHIP_PUBLIC = 'false'
    expect(isPublicMembershipEnabled()).toBe(false)
  })
})
