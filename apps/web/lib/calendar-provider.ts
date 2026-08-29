import 'server-only'
import { bsToAd } from '@nagarikwatch/db'
import type { PublishedCalendarEvent, PublishedCalendarSchedule } from '@/lib/calendar-view'
import { validateManualLiveData } from '@/lib/live/manual-schema'
import { setManualLiveRecord } from '@/lib/live/manual'

const TIMEOUT_MS = 8_000
const SCHEDULE_CACHE_MS = 6 * 60 * 60 * 1000

let providerCache: { year: number; at: number; value: PublishedCalendarSchedule } | null = null

export type CalendarProviderState = {
  provider: 'bizzpatro' | 'json'
  configured: boolean
  source: string
  detail: string
}

type BizzPatroEvent = {
  name_en?: string
  name_ne?: string
  is_holiday?: boolean
  verification_status?: string
}

type BizzPatroDay = {
  bs_day?: number
  events?: BizzPatroEvent[]
  holidays?: BizzPatroEvent[]
}

type BizzPatroMonthResponse = {
  success?: boolean
  data?: {
    bs_year?: number
    bs_month?: number
    days?: BizzPatroDay[]
  }
  meta?: { generated_at?: string }
  errors?: Array<{ message?: string }> | string[]
}

function providerName(): 'bizzpatro' | 'json' {
  return process.env.CALENDAR_PROVIDER?.trim().toLowerCase() === 'json' ? 'json' : 'bizzpatro'
}

export function getCalendarProviderState(): CalendarProviderState {
  const provider = providerName()
  if (provider === 'json') {
    const configured = Boolean(process.env.CALENDAR_API_URL?.trim())
    return {
      provider,
      configured,
      source: process.env.CALENDAR_SOURCE_NAME?.trim() || 'Configured calendar API',
      detail: configured
        ? 'Normalized calendar JSON endpoint is configured.'
        : 'Set CALENDAR_API_URL for the normalized calendar feed.',
    }
  }
  const configured = Boolean(process.env.CALENDAR_API_KEY?.trim())
  return {
    provider,
    configured,
    source: 'BizzPatro API',
    detail: configured
      ? 'BizzPatro calendar month/event feed is configured.'
      : 'Set CALENDAR_API_KEY to sync verified BS events and holidays automatically.',
  }
}

function normalizeProviderEvent(
  raw: BizzPatroEvent,
  month: number,
  day: number,
): PublishedCalendarEvent | null {
  const nameNe = raw.name_ne?.trim()
  const nameEn = raw.name_en?.trim()
  if (!nameNe || !nameEn) return null
  const verification = raw.verification_status?.trim().toUpperCase()
  if (verification && verification !== 'VERIFIED') return null
  return {
    month,
    day,
    nameNe,
    nameEn,
    holiday: Boolean(raw.is_holiday),
  }
}

function dedupeEvents(events: PublishedCalendarEvent[]): PublishedCalendarEvent[] {
  const seen = new Set<string>()
  return events
    .filter((event) => {
      const key = `${event.month}:${event.day}:${event.nameNe.trim().toLowerCase()}:${event.nameEn.trim().toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.month - b.month || a.day - b.day || a.nameNe.localeCompare(b.nameNe, 'ne'))
}

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T> {
  const response = await fetch(url, {
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Calendar provider returned ${response.status}`)
  return (await response.json()) as T
}

async function fetchBizzPatroMonth(year: number, month: number, apiKey: string) {
  const base = (process.env.CALENDAR_API_BASE || 'https://bizzpatro.com').replace(/\/$/, '')
  const params = new URLSearchParams({ bs_year: String(year), bs_month: String(month) })
  const response = await fetchJson<BizzPatroMonthResponse>(
    `${base}/api/v1/calendar/month?${params}`,
    { 'X-API-Key': apiKey },
  )
  if (response.success === false || !response.data?.days) {
    const detail = Array.isArray(response.errors)
      ? response.errors
          .map((item) => (typeof item === 'string' ? item : item.message || ''))
          .filter(Boolean)
          .join('; ')
      : ''
    throw new Error(detail || `BizzPatro did not return BS ${year}/${month}`)
  }
  return response
}

async function fetchBizzPatroSchedule(year: number): Promise<PublishedCalendarSchedule> {
  const apiKey = process.env.CALENDAR_API_KEY?.trim()
  if (!apiKey) throw new Error('CALENDAR_API_KEY is not configured')

  const responses: BizzPatroMonthResponse[] = []
  for (let month = 1; month <= 12; month += 3) {
    const batch = await Promise.all(
      [month, month + 1, month + 2]
        .filter((value) => value <= 12)
        .map((value) => fetchBizzPatroMonth(year, value, apiKey)),
    )
    responses.push(...batch)
  }

  const events: PublishedCalendarEvent[] = []
  let updatedAt = ''
  for (const response of responses) {
    const month = Number(response.data?.bs_month)
    const generatedAt = response.meta?.generated_at
    if (generatedAt && (!updatedAt || Date.parse(generatedAt) > Date.parse(updatedAt))) updatedAt = generatedAt
    for (const day of response.data?.days ?? []) {
      const dayNumber = Number(day.bs_day)
      if (!Number.isInteger(month) || !Number.isInteger(dayNumber)) continue
      for (const raw of [...(day.events ?? []), ...(day.holidays ?? [])]) {
        const event = normalizeProviderEvent(raw, month, dayNumber)
        if (event) events.push(event)
      }
    }
  }

  return validateSchedule({
    year,
    source: 'BizzPatro API',
    updatedAt: updatedAt || new Date().toISOString(),
    events: dedupeEvents(events),
  })
}

type NormalizedCalendarResponse = {
  year?: number
  source?: string
  updatedAt?: string
  events?: PublishedCalendarEvent[]
  data?: {
    year?: number
    source?: string
    updatedAt?: string
    events?: PublishedCalendarEvent[]
  }
}

async function fetchNormalizedSchedule(year: number): Promise<PublishedCalendarSchedule> {
  const endpoint = process.env.CALENDAR_API_URL?.trim()
  if (!endpoint) throw new Error('CALENDAR_API_URL is not configured')
  const url = new URL(endpoint)
  url.searchParams.set('bs_year', String(year))
  const headers: HeadersInit = {}
  const apiKey = process.env.CALENDAR_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  const body = await fetchJson<NormalizedCalendarResponse>(url.toString(), headers)
  const payload = body.data ?? body
  return validateSchedule({
    year: Number(payload.year ?? year),
    source:
      payload.source?.trim() || process.env.CALENDAR_SOURCE_NAME?.trim() || 'Configured calendar API',
    updatedAt: payload.updatedAt || new Date().toISOString(),
    events: Array.isArray(payload.events) ? payload.events : [],
  })
}

function validateSchedule(schedule: PublishedCalendarSchedule): PublishedCalendarSchedule {
  if (!Number.isInteger(schedule.year) || schedule.year < 2000 || schedule.year > 2099) {
    throw new Error('Calendar provider returned an unsupported Bikram Sambat year')
  }
  const validation = validateManualLiveData('calendar-schedule', {
    year: schedule.year,
    events: schedule.events,
  })
  if (!validation.ok) throw new Error(validation.message)
  for (const event of schedule.events) {
    if (!bsToAd(schedule.year, event.month, event.day)) {
      throw new Error(`Calendar provider returned invalid BS date ${schedule.year}/${event.month}/${event.day}`)
    }
  }
  if (!schedule.source.trim()) throw new Error('Calendar provider did not identify its source')
  return {
    ...schedule,
    source: schedule.source.trim(),
    events: dedupeEvents(schedule.events),
  }
}

export async function fetchCalendarScheduleFromProvider(
  year: number,
  options: { bypassCache?: boolean } = {},
): Promise<PublishedCalendarSchedule> {
  if (
    !options.bypassCache &&
    providerCache?.year === year &&
    Date.now() - providerCache.at < SCHEDULE_CACHE_MS
  ) {
    return providerCache.value
  }
  const state = getCalendarProviderState()
  if (!state.configured) throw new Error(state.detail)
  const value =
    state.provider === 'json'
      ? await fetchNormalizedSchedule(year)
      : await fetchBizzPatroSchedule(year)
  providerCache = { year, at: Date.now(), value }
  return value
}

export async function syncCalendarScheduleFromProvider(
  year: number,
): Promise<PublishedCalendarSchedule> {
  const schedule = await fetchCalendarScheduleFromProvider(year, { bypassCache: true })
  await setManualLiveRecord({
    key: 'calendar-schedule',
    source: schedule.source,
    data: { year: schedule.year, events: schedule.events },
  })
  return schedule
}
