import { bsMonthLength } from '@nagarikwatch/db'

export type ManualLiveKey =
  | 'nepse'
  | 'forex'
  | 'gold-silver'
  | 'football'
  | 'cricket'
  | 'rashifal'
  | 'calendar-schedule'

export type ManualValidation = { ok: true } | { ok: false; message: string }

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown, max = 240): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function validateManualLiveData(key: string, data: unknown): ManualValidation {
  switch (key as ManualLiveKey) {
    case 'nepse':
      return validateNepse(data)
    case 'forex':
      return validateForex(data)
    case 'gold-silver':
      return validateGold(data)
    case 'football':
      return validateFootball(data)
    case 'cricket':
      return validateCricket(data)
    case 'rashifal':
      return validateRashifal(data)
    case 'calendar-schedule':
      return validateCalendarSchedule(data)
    default:
      return { ok: false, message: 'Unsupported live-data key.' }
  }
}

export function isManualNepse(data: unknown): data is {
  index: number
  change: number
  changePercent: number
  open: boolean
} {
  return validateNepse(data).ok
}

export function isManualForex(data: unknown): data is Array<{
  iso3: string
  name: string
  buy: number
  sell: number
  unit: string
}> {
  return validateForex(data).ok
}

export function isManualGold(data: unknown): data is {
  goldTolaNpr: number
  silverTolaNpr: number
  goldGramNpr: number
  silverGramNpr: number
  unit: string
} {
  return validateGold(data).ok
}

function validateNepse(data: unknown): ManualValidation {
  if (!isRecord(data)) return invalid('NEPSE must be a JSON object.')
  if (!isFiniteNumber(data.index) || data.index <= 0)
    return invalid('NEPSE index must be positive.')
  if (!isFiniteNumber(data.change)) return invalid('NEPSE change must be a number.')
  if (!isFiniteNumber(data.changePercent)) return invalid('NEPSE changePercent must be a number.')
  if (typeof data.open !== 'boolean') return invalid('NEPSE open must be true or false.')
  return { ok: true }
}

function validateForex(data: unknown): ManualValidation {
  if (!Array.isArray(data) || data.length === 0) return invalid('Forex must be a non-empty array.')
  if (data.length > 40) return invalid('Forex override has too many currencies.')
  const seen = new Set<string>()
  for (const row of data) {
    if (!isRecord(row)) return invalid('Each forex row must be an object.')
    if (!isNonEmptyString(row.iso3, 3) || !/^[A-Z]{3}$/.test(row.iso3)) {
      return invalid('Each forex row needs a three-letter uppercase ISO code.')
    }
    if (seen.has(row.iso3)) return invalid(`Duplicate forex currency: ${row.iso3}.`)
    seen.add(row.iso3)
    if (!isNonEmptyString(row.name, 80)) return invalid(`Forex ${row.iso3} needs a currency name.`)
    if (!isFiniteNumber(row.buy) || row.buy <= 0)
      return invalid(`Forex ${row.iso3} buy must be positive.`)
    if (!isFiniteNumber(row.sell) || row.sell <= 0)
      return invalid(`Forex ${row.iso3} sell must be positive.`)
    if (row.sell < row.buy) return invalid(`Forex ${row.iso3} sell cannot be below buy.`)
    if (!isNonEmptyString(row.unit, 32)) return invalid(`Forex ${row.iso3} needs a unit.`)
  }
  return { ok: true }
}

function validateGold(data: unknown): ManualValidation {
  if (!isRecord(data)) return invalid('Gold/Silver must be a JSON object.')
  for (const key of ['goldTolaNpr', 'silverTolaNpr', 'goldGramNpr', 'silverGramNpr'] as const) {
    if (!isFiniteNumber(data[key]) || data[key] <= 0) return invalid(`${key} must be positive.`)
  }
  if (!isNonEmptyString(data.unit, 80)) return invalid('Gold/Silver needs a unit.')
  return { ok: true }
}

function validateFootball(data: unknown): ManualValidation {
  if (!Array.isArray(data)) return invalid('Football data must be an array.')
  if (data.length > 60) return invalid('Football override has too many matches.')
  for (const row of data) {
    if (!isRecord(row)) return invalid('Each football row must be an object.')
    if (!isNonEmptyString(row.league, 120)) return invalid('Football league is required.')
    if (!isNonEmptyString(row.home, 120) || !isNonEmptyString(row.away, 120)) {
      return invalid('Football home and away teams are required.')
    }
    if (!isNonEmptyString(row.score, 40) || !isNonEmptyString(row.status, 40)) {
      return invalid('Football score and status are required.')
    }
  }
  return { ok: true }
}

function validateCricket(data: unknown): ManualValidation {
  if (!Array.isArray(data)) return invalid('Cricket data must be an array.')
  if (data.length > 60) return invalid('Cricket override has too many matches.')
  for (const row of data) {
    if (!isRecord(row)) return invalid('Each cricket row must be an object.')
    if (!isNonEmptyString(row.league, 120)) return invalid('Cricket league is required.')
    if (!isNonEmptyString(row.home, 120) || !isNonEmptyString(row.away, 120)) {
      return invalid('Cricket home and away teams are required.')
    }
    if (!isNonEmptyString(row.score, 80) || !isNonEmptyString(row.status, 40)) {
      return invalid('Cricket score and status are required.')
    }
  }
  return { ok: true }
}

function validateRashifal(data: unknown): ManualValidation {
  if (!isRecord(data)) return invalid('Rashifal must be a JSON object.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date ?? ''))) {
    return invalid('Rashifal date must be YYYY-MM-DD in Kathmandu local date.')
  }
  if (!Array.isArray(data.signs) || data.signs.length !== 12) {
    return invalid('Rashifal must contain exactly 12 signs.')
  }
  const seen = new Set<string>()
  for (const sign of data.signs) {
    if (!isRecord(sign)) return invalid('Each rashifal sign must be an object.')
    if (!isNonEmptyString(sign.slug, 40)) return invalid('Each rashifal sign needs a slug.')
    if (seen.has(sign.slug)) return invalid(`Duplicate rashifal sign: ${sign.slug}.`)
    seen.add(sign.slug)
    if (!isNonEmptyString(sign.forecastNe, 900)) return invalid(`${sign.slug} needs forecastNe.`)
    if (sign.forecastEn != null && !isNonEmptyString(sign.forecastEn, 900)) {
      return invalid(`${sign.slug} forecastEn is invalid.`)
    }
  }
  return { ok: true }
}

function validateCalendarSchedule(data: unknown): ManualValidation {
  if (!isRecord(data)) return invalid('Calendar schedule must be a JSON object.')
  if (!Number.isInteger(data.year) || Number(data.year) < 2000 || Number(data.year) > 2099) {
    return invalid('Calendar schedule needs a valid Bikram Sambat year.')
  }
  if (!Array.isArray(data.events)) return invalid('Calendar schedule events must be an array.')
  if (data.events.length > 500) return invalid('Calendar schedule has too many events.')
  const seen = new Set<string>()
  for (const event of data.events) {
    if (!isRecord(event)) return invalid('Each calendar event must be an object.')
    if (!Number.isInteger(event.month) || Number(event.month) < 1 || Number(event.month) > 12) {
      return invalid('Calendar event month must be 1–12.')
    }
    const month = Number(event.month)
    const day = Number(event.day)
    let monthLength = 0
    try {
      monthLength = bsMonthLength(Number(data.year), month)
    } catch {
      return invalid('Calendar event is outside the supported Bikram Sambat range.')
    }
    if (!Number.isInteger(day) || day < 1 || day > monthLength) {
      return invalid(`Calendar event day must be valid for B.S. ${data.year}/${month}.`)
    }
    const nameNe = event.nameNe
    const nameEn = event.nameEn
    if (!isNonEmptyString(nameNe, 180) || !isNonEmptyString(nameEn, 180)) {
      return invalid('Calendar event needs Nepali and English names.')
    }
    if (event.holiday != null && typeof event.holiday !== 'boolean') {
      return invalid('Calendar event holiday must be true or false.')
    }
    const fingerprint = `${month}:${day}:${nameNe.trim().toLowerCase()}`
    if (seen.has(fingerprint)) return invalid('Calendar schedule contains a duplicate event.')
    seen.add(fingerprint)
  }
  return { ok: true }
}

function invalid(message: string): ManualValidation {
  return { ok: false, message }
}
