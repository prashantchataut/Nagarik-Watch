import { describe, expect, it } from 'vitest'
import { requestWantsSaveData } from './save-data'

const headersWith = (entries: Record<string, string>) => new Headers(entries)

describe('requestWantsSaveData', () => {
  it('honours the legacy Save-Data header', () => {
    expect(requestWantsSaveData(headersWith({ 'save-data': 'on' }))).toBe(true)
    expect(requestWantsSaveData(headersWith({ 'save-data': 'ON' }))).toBe(true)
    // `off` is the only other value the header takes, and it means no.
    expect(requestWantsSaveData(headersWith({ 'save-data': 'off' }))).toBe(false)
  })

  it('honours the client hint in both its boolean and token spellings', () => {
    for (const value of ['?1', '1', 'on', 'reduce']) {
      expect(
        requestWantsSaveData(headersWith({ 'sec-ch-prefers-reduced-data': value })),
        value,
      ).toBe(true)
    }
    expect(requestWantsSaveData(headersWith({ 'sec-ch-prefers-reduced-data': '?0' }))).toBe(false)
    expect(
      requestWantsSaveData(headersWith({ 'sec-ch-prefers-reduced-data': 'no-preference' })),
    ).toBe(false)
  })

  it('defaults to the full experience when neither header is sent', () => {
    expect(requestWantsSaveData(headersWith({}))).toBe(false)
  })
})
