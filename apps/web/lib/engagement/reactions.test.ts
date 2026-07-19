import { describe, expect, it } from 'vitest'
import { isReactionEmoji, REACTION_EMOJIS } from './reactions-client'
import { hashVisitor } from './reactions'

describe('reactions helpers', () => {
  it('accepts only allowlisted emoji', () => {
    expect(isReactionEmoji('👍')).toBe(true)
    expect(isReactionEmoji('xyz')).toBe(false)
    expect(REACTION_EMOJIS.length).toBeGreaterThan(0)
  })

  it('hashes visitor seeds stably', () => {
    expect(hashVisitor('reader-a')).toBe(hashVisitor('reader-a'))
    expect(hashVisitor('reader-a')).not.toBe(hashVisitor('reader-b'))
  })
})
