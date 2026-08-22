import 'server-only'
import { getManualLiveRecord } from '@/lib/live/manual'
import { validateManualLiveData } from '@/lib/live/manual-schema'

export type RashifalSignMeta = {
  slug: string
  nameNe: string
  nameEn: string
  symbol: string
}

export type PublishedRashifalSign = RashifalSignMeta & {
  forecastNe: string
  forecastEn?: string
}

export type PublishedRashifal = {
  date: string
  source: string
  updatedAt: string
  signs: PublishedRashifalSign[]
}

export const RASHIFAL_SIGNS: readonly RashifalSignMeta[] = [
  { slug: 'mesha', nameNe: 'मेष', nameEn: 'Aries', symbol: '♈' },
  { slug: 'vrishabha', nameNe: 'वृषभ', nameEn: 'Taurus', symbol: '♉' },
  { slug: 'mithuna', nameNe: 'मिथुन', nameEn: 'Gemini', symbol: '♊' },
  { slug: 'karka', nameNe: 'कर्क', nameEn: 'Cancer', symbol: '♋' },
  { slug: 'simha', nameNe: 'सिंह', nameEn: 'Leo', symbol: '♌' },
  { slug: 'kanya', nameNe: 'कन्या', nameEn: 'Virgo', symbol: '♍' },
  { slug: 'tula', nameNe: 'तुला', nameEn: 'Libra', symbol: '♎' },
  { slug: 'vrishchika', nameNe: 'वृश्चिक', nameEn: 'Scorpio', symbol: '♏' },
  { slug: 'dhanu', nameNe: 'धनु', nameEn: 'Sagittarius', symbol: '♐' },
  { slug: 'makara', nameNe: 'मकर', nameEn: 'Capricorn', symbol: '♑' },
  { slug: 'kumbha', nameNe: 'कुम्भ', nameEn: 'Aquarius', symbol: '♒' },
  { slug: 'mina', nameNe: 'मीन', nameEn: 'Pisces', symbol: '♓' },
] as const

export function kathmanduDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function getPublishedRashifal(date = new Date()): Promise<PublishedRashifal | null> {
  const record = await getManualLiveRecord<unknown>('rashifal').catch(() => null)
  if (!record) return null
  if (!validateManualLiveData('rashifal', record.data).ok) return null

  const raw = record.data as {
    date: string
    signs: Array<{ slug: string; forecastNe: string; forecastEn?: string }>
  }
  if (raw.date !== kathmanduDateKey(date)) return null

  const bySlug = new Map(raw.signs.map((sign) => [sign.slug, sign]))
  if (RASHIFAL_SIGNS.some((meta) => !bySlug.has(meta.slug))) return null

  return {
    date: raw.date,
    source: record.source,
    updatedAt: record.updatedAt,
    signs: RASHIFAL_SIGNS.map((meta) => {
      const forecast = bySlug.get(meta.slug)!
      return {
        ...meta,
        forecastNe: forecast.forecastNe,
        forecastEn: forecast.forecastEn,
      }
    }),
  }
}
