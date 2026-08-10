import { describe, expect, it } from 'vitest'
import { requestWantsSaveData } from './save-data'

describe('requestWantsSaveData', () => {
  it('recognizes the Save-Data preference', () => {
    expect(requestWantsSaveData(new Headers({ 'Save-Data': 'on' }))).toBe(true)
    expect(requestWantsSaveData(new Headers({ 'Save-Data': 'OFF' }))).toBe(false)
  })

  it('recognizes reduced-data client hints', () => {
    expect(requestWantsSaveData(new Headers({ 'Sec-CH-Prefers-Reduced-Data': 'reduce' }))).toBe(
      true,
    )
    expect(
      requestWantsSaveData(new Headers({ 'Sec-CH-Prefers-Reduced-Data': 'no-preference' })),
    ).toBe(false)
  })

  it('defaults to normal delivery', () => {
    expect(requestWantsSaveData(new Headers())).toBe(false)
  })
})
