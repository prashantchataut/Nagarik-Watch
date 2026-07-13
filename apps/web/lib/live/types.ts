import type { Locale } from '@nagarikwatch/db'

export type LiveDataStatus = 'ok' | 'error' | 'empty'

export type LiveDataEnvelope<T> = {
  status: LiveDataStatus
  source: string
  updatedAt: string
  data: T
  error?: string
}

export type LiveStatus = 'ok' | 'loading' | 'error' | 'empty'

export interface LiveValue<T> {
  status: LiveStatus
  data?: T
  source: string
  updatedAt: string
  /** Reserved for explicitly labelled preview/demo feeds. Production providers never fabricate data. */
  mock: boolean
  error?: string
}

export interface WeatherReading {
  placeNe: string
  placeEn: string
  tempC: number
  condition: 'clear' | 'clouds' | 'rain' | 'haze' | 'storm'
}

export interface AqiReading {
  aqi: number
  placeNe: string
  placeEn: string
}

export interface NepseReading {
  index: number
  change: number
  changePercent: number
  open: boolean
}

export type FootballScore = {
  league: string
  home: string
  away: string
  score: string
  minute: string
  status: 'live' | 'fixture' | 'finished'
}

export type CricketScore = {
  league: string
  home: string
  away: string
  score: string
  status: string
}

export type AlertData = {
  severity: 'info' | 'watch' | 'warning'
  title: string
  area: string
  id?: string
  occurredAt?: string
  url?: string
  detail?: string
}

export type ElectionResult = {
  region: string
  body: string
  reportedPercent: number
  summary: string
}

export type ExamResult = {
  exam: string
  board: string
  publishedOn: string
  summary: string
}

export type ParliamentLiveStatus = {
  inSession: boolean
  title: string
  startedAt?: string
  streamUrl?: string
}

export type YouTubeLiveStatus = {
  channelId: string
  isLive: boolean
  title: string
  videoId?: string
}

export function failedLiveValue<T>(source: string, error: unknown): LiveValue<T> {
  return {
    status: 'error',
    source,
    updatedAt: new Date().toISOString(),
    mock: false,
    error: error instanceof Error ? error.message : 'Live provider failed',
  }
}

export function emptyLiveValue<T>(source: string): LiveValue<T> {
  return {
    status: 'empty',
    source,
    updatedAt: new Date().toISOString(),
    mock: false,
  }
}

/** Keeps Locale in this contract package so provider signatures stay consistent. */
export type LiveLocale = Locale
