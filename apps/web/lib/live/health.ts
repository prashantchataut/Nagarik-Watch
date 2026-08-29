import { getDisasterAlerts } from '@/lib/live/disaster'
import { getManualLiveRecord } from '@/lib/live/manual'
import {
  getRealAqi,
  getRealForex,
  getRealGoldSilver,
  getRealNepse,
  getRealWeather,
} from '@/lib/live/real'
import { getCricketScores, getFootballScores } from '@/lib/live/sports'
import { getCalendarProviderState } from '@/lib/calendar-provider'
import { getPublishedCalendarSchedule } from '@/lib/calendar-schedule'
import type { LiveDataEnvelope, LiveValue } from '@/lib/live/types'

export type ProviderHealth = {
  key: string
  label: string
  envVars: string[]
  status: 'ok' | 'error' | 'empty' | 'unconfigured'
  source: string
  updatedAt: string
  error?: string
}

type CheckResult = Pick<ProviderHealth, 'status' | 'source' | 'updatedAt' | 'error'>
type ProviderDefinition = {
  key: string
  label: string
  envVars: string[]
  requiresConfiguration?: boolean
  check: () => Promise<CheckResult>
}

function fromLiveValue<T>(value: LiveValue<T>): CheckResult {
  return {
    status: value.status === 'loading' ? 'error' : value.status,
    source: value.source,
    updatedAt: value.updatedAt,
    error: value.error,
  }
}

function fromEnvelope<T>(value: LiveDataEnvelope<T>): CheckResult {
  return {
    status: value.status,
    source: value.source,
    updatedAt: value.updatedAt,
    error: value.error,
  }
}


async function calendarHealth(): Promise<CheckResult> {
  const state = getCalendarProviderState()
  if (!state.configured) {
    return {
      status: 'unconfigured',
      source: state.source,
      updatedAt: new Date().toISOString(),
      error: state.detail,
    }
  }
  const schedule = await getPublishedCalendarSchedule()
  if (!schedule) {
    return {
      status: 'empty',
      source: state.source,
      updatedAt: new Date().toISOString(),
      error: 'No validated current-year Bikram Sambat schedule is available yet.',
    }
  }
  return {
    status: 'ok',
    source: schedule.source,
    updatedAt: schedule.updatedAt,
  }
}

async function manualOnly(key: string, label: string): Promise<CheckResult> {
  const record = await getManualLiveRecord(key)
  if (record) {
    return { status: 'ok', source: record.source, updatedAt: record.updatedAt }
  }
  return {
    status: 'unconfigured',
    source: `${label}: newsroom manual source not configured`,
    updatedAt: new Date().toISOString(),
  }
}

const PROVIDERS: ProviderDefinition[] = [
  {
    key: 'weather',
    label: 'Weather',
    envVars: [],
    check: async () => fromLiveValue(await getRealWeather('ne')),
  },
  {
    key: 'aqi',
    label: 'AQI',
    envVars: [],
    check: async () => fromLiveValue(await getRealAqi('ne')),
  },
  {
    key: 'nepse',
    label: 'NEPSE',
    envVars: ['NEPSE_API_URL', 'NEPSE_API_KEY'],
    check: async () => fromLiveValue(await getRealNepse('ne')),
  },
  {
    key: 'bullion',
    label: 'Gold and silver',
    envVars: ['GOLD_SILVER_API_URL', 'GOLD_SILVER_API_KEY'],
    check: async () => fromLiveValue(await getRealGoldSilver('ne')),
  },
  {
    key: 'forex',
    label: 'Forex',
    envVars: [],
    check: async () => fromLiveValue(await getRealForex('ne')),
  },
  {
    key: 'calendar',
    label: 'Bikram Sambat calendar',
    envVars: ['CALENDAR_API_KEY', 'CALENDAR_API_URL'],
    requiresConfiguration: true,
    check: calendarHealth,
  },
  {
    key: 'football',
    label: 'Football / FIFA',
    envVars: ['FOOTBALL_API_KEY'],
    requiresConfiguration: true,
    check: async () => fromEnvelope(await getFootballScores()),
  },
  {
    key: 'cricket',
    label: 'Cricket',
    envVars: ['CRICKET_API_KEY'],
    requiresConfiguration: true,
    check: async () => fromEnvelope(await getCricketScores()),
  },
  {
    key: 'disaster',
    label: 'Disaster alerts',
    envVars: ['DISASTER_ALERT_API_URL'],
    check: async () => fromEnvelope(await getDisasterAlerts()),
  },
  {
    key: 'election',
    label: 'Election results',
    envVars: [],
    check: () => manualOnly('election', 'Election results'),
  },
  {
    key: 'exams',
    label: 'Exam results',
    envVars: [],
    check: () => manualOnly('exam-results', 'Exam results'),
  },
  {
    key: 'parliament',
    label: 'Parliament live',
    envVars: ['PARLIAMENT_LIVE_URL'],
    check: () => manualOnly('parliament', 'Parliament live'),
  },
  {
    key: 'youtube',
    label: 'YouTube live',
    envVars: ['YOUTUBE_CHANNEL_ID', 'YOUTUBE_API_KEY'],
    check: () => manualOnly('youtube-live', 'YouTube live'),
  },
]

function configured(envVars: string[]): boolean {
  return envVars.some((name) => Boolean(process.env[name]))
}

const HEALTH_TTL_MS = 45_000
let healthCache: { at: number; value: ProviderHealth[] } | null = null

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  if (healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.value
  }
  const value = await Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        const result = await provider.check()
        const missingRequiredConfiguration =
          provider.requiresConfiguration && !configured(provider.envVars) && result.status !== 'ok'
        return {
          key: provider.key,
          label: provider.label,
          envVars: provider.envVars,
          ...result,
          status: missingRequiredConfiguration ? 'unconfigured' : result.status,
        }
      } catch (error) {
        return {
          key: provider.key,
          label: provider.label,
          envVars: provider.envVars,
          status: 'error' as const,
          source: 'Provider health check failed',
          updatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown provider failure',
        }
      }
    }),
  )
  healthCache = { at: Date.now(), value }
  return value
}
