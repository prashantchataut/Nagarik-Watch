import {
  getAQI,
  getDisasterAlerts,
  getElectionResults,
  getExamResults,
  getForexRates,
  getGoldSilverRates,
  getNepseMarket,
  getParliamentLive,
  getSportsScores,
  getWeather,
  getYouTubeLiveStatus,
  type LiveDataEnvelope,
} from '@/lib/live-data'
// Real sports fetchers (provider-aware) replace the mock-based ones from live-data.
import { getFootballScores as getRealFootball, getCricketScores as getRealCricket } from '@/lib/live/sports'

export type ProviderHealth = {
  key: string
  label: string
  envVars: string[]
  status: LiveDataEnvelope<unknown>['status'] | 'unconfigured'
  source: string
  updatedAt: string
  error?: string
}

const PROVIDERS = [
  { key: 'weather', label: 'Weather', envVars: ['WEATHER_API_KEY'], check: getWeather },
  { key: 'aqi', label: 'AQI', envVars: ['AQI_API_KEY'], check: getAQI },
  { key: 'nepse', label: 'NEPSE', envVars: ['NEPSE_API_KEY'], check: getNepseMarket },
  {
    key: 'bullion',
    label: 'Gold and silver',
    envVars: ['GOLD_SILVER_API_KEY'],
    check: getGoldSilverRates,
  },
  { key: 'forex', label: 'Forex', envVars: ['FOREX_API_KEY'], check: getForexRates },
  { key: 'sports', label: 'Sports scores', envVars: ['SPORTS_API_KEY'], check: getSportsScores },
  { key: 'football', label: 'Football', envVars: ['FOOTBALL_API_KEY'], check: getRealFootball },
  { key: 'cricket', label: 'Cricket', envVars: ['CRICKET_API_KEY'], check: getRealCricket },
  {
    key: 'election',
    label: 'Election results',
    envVars: ['ELECTION_API_KEY'],
    check: getElectionResults,
  },
  { key: 'exams', label: 'Exam results', envVars: ['EXAM_RESULTS_API_KEY'], check: getExamResults },
  {
    key: 'disaster',
    label: 'Disaster alerts',
    envVars: ['DISASTER_ALERT_API_KEY'],
    check: getDisasterAlerts,
  },
  {
    key: 'parliament',
    label: 'Parliament live',
    envVars: ['PARLIAMENT_LIVE_URL'],
    check: getParliamentLive,
  },
  {
    key: 'youtube',
    label: 'YouTube live',
    envVars: ['YOUTUBE_API_KEY'],
    check: getYouTubeLiveStatus,
  },
] as const

function configured(envVars: readonly string[]): boolean {
  return envVars.some((name) => Boolean(process.env[name]))
}

export async function getProviderHealth(): Promise<ProviderHealth[]> {
  return Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        const result = await provider.check()
        return {
          key: provider.key,
          label: provider.label,
          envVars: [...provider.envVars],
          status:
            result.status === 'mock' && !configured(provider.envVars)
              ? 'unconfigured'
              : result.status,
          source: result.source,
          updatedAt: result.updatedAt,
          error: result.error,
        }
      } catch (error) {
        return {
          key: provider.key,
          label: provider.label,
          envVars: [...provider.envVars],
          status: 'error',
          source: 'Provider check failed',
          updatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown provider failure',
        }
      }
    }),
  )
}
