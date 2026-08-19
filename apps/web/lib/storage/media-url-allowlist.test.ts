import { describe, expect, it } from 'vitest'
import { isAllowedMediaLibraryUrl } from './media-url-allowlist'

describe('media URL allowlist', () => {
  it('allows https URLs', () => {
    expect(isAllowedMediaLibraryUrl('https://cdn.example.com/a.jpg')).toBe(true)
  })

  it('rejects non-http schemes', () => {
    expect(isAllowedMediaLibraryUrl('ftp://cdn.example.com/a.jpg')).toBe(false)
    expect(isAllowedMediaLibraryUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects plain http remote hosts', () => {
    expect(isAllowedMediaLibraryUrl('http://cdn.example.com/a.jpg')).toBe(false)
  })
})
