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
    const result = validateImageUpload({
      buffer: Buffer.alloc(0),
      declaredType: 'image/png',
      size: 0,
    })
    expect(result.ok).toBe(false)
  })

  it('rejects executable masquerading as image', () => {
    const exe = Buffer.from('MZ' + 'bad'.repeat(20))
    const result = validateImageUpload({
      buffer: exe,
      declaredType: 'image/jpeg',
      size: exe.length,
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a WebP RIFF header', () => {
    const webp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38,
      0x20,
    ])
    const result = validateImageUpload({
      buffer: webp,
      declaredType: 'image/webp',
      size: webp.length,
    })
    expect(result.ok).toBe(true)
  })

  it('accepts an AVIF ftyp header', () => {
    const avif = Buffer.from([
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00,
      0x00, 0x61, 0x76, 0x69, 0x66, 0x6d, 0x69, 0x66, 0x31,
    ])
    const result = validateImageUpload({
      buffer: avif,
      declaredType: 'image/avif',
      size: avif.length,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a valid image whose declared MIME type disagrees with its contents', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, ...new Array(16).fill(0)])
    const result = validateImageUpload({
      buffer: jpeg,
      declaredType: 'image/png',
      size: jpeg.length,
    })
    expect(result.ok).toBe(false)
  })
})
