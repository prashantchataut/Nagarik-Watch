import { afterEach, describe, expect, it } from 'vitest'
import {
  calendarHostname,
  getCalendarOrigin,
  isCalendarHostname,
  mainSiteHref,
  patroEntryHref,
} from './calendar-host'

describe('calendar-host', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CALENDAR_HOST
  })

  it('returns null origin when unset', () => {
    expect(getCalendarOrigin()).toBeNull()
    expect(calendarHostname()).toBeNull()
    expect(patroEntryHref('ne')).toMatch(/^\/patro\/?$/)
    expect(patroEntryHref('en')).toMatch(/^\/en\/patro\/?$/)
  })

  it('parses configured origin and builds entry hrefs', () => {
    process.env.NEXT_PUBLIC_CALENDAR_HOST = 'calendar.example.com'
    expect(getCalendarOrigin()).toBe('https://calendar.example.com')
    expect(calendarHostname()).toBe('calendar.example.com')
    expect(patroEntryHref('ne')).toBe('https://calendar.example.com/')
    expect(patroEntryHref('en')).toBe('https://calendar.example.com/en')
  })

  it('detects calendar hostnames', () => {
    process.env.NEXT_PUBLIC_CALENDAR_HOST = 'https://calendar.example.com'
    expect(isCalendarHostname('calendar.example.com')).toBe(true)
    expect(isCalendarHostname('calendar.example.com:443')).toBe(true)
    expect(isCalendarHostname('calendar.localhost')).toBe(true)
    expect(isCalendarHostname('calendar.preview.test')).toBe(true)
    expect(isCalendarHostname('www.example.com')).toBe(false)
  })

  it('detects patro hostnames', () => {
    process.env.NEXT_PUBLIC_CALENDAR_HOST = 'https://patro.nagarikwatch.com'
    expect(getCalendarOrigin()).toBe('https://patro.nagarikwatch.com')
    expect(patroEntryHref('ne')).toBe('https://patro.nagarikwatch.com/')
    expect(patroEntryHref('en')).toBe('https://patro.nagarikwatch.com/en')
    expect(isCalendarHostname('patro.nagarikwatch.com')).toBe(true)
    expect(isCalendarHostname('patro.localhost')).toBe(true)
    expect(isCalendarHostname('patro.preview.test')).toBe(true)
  })

  it('builds absolute main-site hrefs', () => {
    expect(mainSiteHref('ne', '/')).toMatch(/\/$|\/ne\/?$|https?:\/\//)
    expect(mainSiteHref('en', '/market')).toContain('/en/market')
  })
})
