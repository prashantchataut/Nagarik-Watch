import { describe, expect, it } from 'vitest'
import { isPublicPublicationValue } from './site'

describe('isPublicPublicationValue', () => {
  it('rejects empty and placeholder legal strings', () => {
    expect(isPublicPublicationValue(undefined)).toBe(false)
    expect(isPublicPublicationValue('')).toBe(false)
    expect(isPublicPublicationValue('pending verification')).toBe(false)
    expect(isPublicPublicationValue('DoIB placeholder')).toBe(false)
    expect(isPublicPublicationValue('replace-before-launch')).toBe(false)
    expect(isPublicPublicationValue('change-me')).toBe(false)
    expect(isPublicPublicationValue('0000000')).toBe(false)
  })

  it('does not invent a default public newsroom email', async () => {
    const { PUBLICATION } = await import('./site')
    // Without NEXT_PUBLIC_NEWSROOM_EMAIL, email stays empty so footer/contact can hide it.
    expect(PUBLICATION.email === '' || !isPublicPublicationValue(PUBLICATION.email)).toBe(true)
  })

  it('accepts real-looking publisher strings', () => {
    expect(isPublicPublicationValue('नागरिक वाच प्रा. लि.')).toBe(true)
    expect(isPublicPublicationValue('123/456/DoIB')).toBe(true)
    expect(isPublicPublicationValue('+977-1-4000000')).toBe(true)
  })
})
