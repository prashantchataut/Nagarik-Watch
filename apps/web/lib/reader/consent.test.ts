import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_KEY,
  CONSENT_POLICY_VERSION,
  READER_ID_KEY,
  clearPersonalizationStorage,
  normalizeConsent,
  readConsent,
  writeConsent,
} from './consent'

function storage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('reader consent', () => {
  beforeEach(() => {
    const localStorage = storage()
    vi.stubGlobal('window', {
      localStorage,
      location: { protocol: 'https:' },
      document: { cookie: '' },
      dispatchEvent: vi.fn(),
    })
  })

  it('normalizes optional categories and enforces essential consent', () => {
    expect(normalizeConsent({ analytics: true, essential: false as never })).toMatchObject({
      essential: true,
      personalization: false,
      analytics: true,
      advertising: false,
      version: CONSENT_POLICY_VERSION,
    })
  })

  it('rejects consent saved under an older policy version', () => {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ analytics: true, version: CONSENT_POLICY_VERSION - 1 }),
    )
    expect(readConsent()).toBeNull()
  })

  it('writes the server-readable consent cookie', () => {
    writeConsent({
      essential: true,
      personalization: false,
      analytics: true,
      advertising: false,
      decidedAt: '2026-07-18T00:00:00.000Z',
      version: CONSENT_POLICY_VERSION,
    })
    expect(window.document.cookie).toContain('nw_consent=')
    expect(decodeURIComponent(window.document.cookie)).toContain('"analytics":true')
  })

  it('clears personalization data without deleting consent', () => {
    window.localStorage.setItem(CONSENT_KEY, '{}')
    window.localStorage.setItem(READER_ID_KEY, 'anon-reader')
    window.localStorage.setItem('nw-saved-stories', '[]')

    clearPersonalizationStorage()

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('{}')
    expect(window.localStorage.getItem(READER_ID_KEY)).toBeNull()
    expect(window.localStorage.getItem('nw-saved-stories')).toBeNull()
    expect(window.document.cookie).toContain('nw_reader=')
    expect(window.document.cookie).toContain('Max-Age=0')
  })
})
