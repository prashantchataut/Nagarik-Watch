import { describe, expect, it } from 'vitest'
import { parseBannedWordPolicy } from './moderation-policy'

describe('parseBannedWordPolicy', () => {
  it('merges admin and env sources without empty tokens', () => {
    expect(parseBannedWordPolicy('अपशब्द, spam\nbad', 'spam,toxic')).toEqual(
      expect.arrayContaining(['अपशब्द', 'spam', 'bad', 'toxic']),
    )
  })

  it('drops single-character noise', () => {
    expect(parseBannedWordPolicy('a, ok')).toEqual(['ok'])
  })
})
