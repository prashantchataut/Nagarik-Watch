import { describe, expect, it } from 'vitest'
import { validateImageUpload } from './media-validation'

describe('media validation', () => {
  it('accepts a tiny PNG', () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    )
    const result = validateImageUpload({ buffer: png, declaredType: 'image/png', size: png.length })
    expect(result.ok).toBe(true)
  })

  it('rejects empty files', () => {
    const result = validateImageUpload({ buffer: Buffer.alloc(0), declaredType: 'image/png', size: 0 })
    expect(result.ok).toBe(false)
  })

  it('rejects executable masquerading as image', () => {
    const exe = Buffer.from('MZ' + 'bad'.repeat(20))
    const result = validateImageUpload({ buffer: exe, declaredType: 'image/jpeg', size: exe.length })
    expect(result.ok).toBe(false)
  })
})
