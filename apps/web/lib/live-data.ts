export type LiveDataStatus = 'ok' | 'mock' | 'error'

export type LiveDataEnvelope<T> = {
  status: LiveDataStatus
  source: string
  updatedAt: string
  data: T
  error?: string
}

export type WeatherData = { city: string; temperatureC: number; condition: string }
export type AQIData = { city: string; aqi: number; label: string }
export type MarketData = { index: string; value: number; change: number; changePercent: number }
export type RateData = { label: string; buy?: number; sell?: number; unit: string }
export type SportsScore = {
  league: string
  home: string
  away: string
  score: string
  status: string
}
export type AlertData = { severity: 'info' | 'watch' | 'warning'; title: string; area: string }

function mock<T>(source: string, data: T): LiveDataEnvelope<T> {
  return {
    status: 'mock',
    source,
    updatedAt: new Date().toISOString(),
    data,
  }
}

export async function getWeather(): Promise<LiveDataEnvelope<WeatherData>> {
  return mock('Mock weather provider, replace with WEATHER_API_KEY provider', {
    city: 'Kathmandu',
    temperatureC: 23,
    condition: 'Partly cloudy',
  })
}

export async function getAQI(): Promise<LiveDataEnvelope<AQIData>> {
  return mock('Mock AQI provider, replace with AQI_API_KEY provider', {
    city: 'Kathmandu',
    aqi: 78,
    label: 'Moderate',
  })
}

export async function getNepseMarket(): Promise<LiveDataEnvelope<MarketData>> {
  return mock('Mock NEPSE provider, replace with NEPSE_API_KEY provider', {
    index: 'NEPSE',
    value: 2108.72,
    change: 12.42,
    changePercent: 0.59,
  })
}

export async function getGoldSilverRates(): Promise<LiveDataEnvelope<RateData[]>> {
  return mock('Mock bullion provider, replace with GOLD_SILVER_API_KEY provider', [
    { label: 'Gold', sell: 142500, unit: 'per tola' },
    { label: 'Silver', sell: 1825, unit: 'per tola' },
  ])
}

export async function getForexRates(): Promise<LiveDataEnvelope<RateData[]>> {
  return mock('Mock forex provider, replace with FOREX_API_KEY provider', [
    { label: 'USD', buy: 133.2, sell: 133.8, unit: 'NPR' },
    { label: 'EUR', buy: 145.4, sell: 146.2, unit: 'NPR' },
  ])
}

export async function getSportsScores(): Promise<LiveDataEnvelope<SportsScore[]>> {
  return mock('Mock sports provider, replace with SPORTS_API_KEY provider', [
    { league: 'Nepal Cricket', home: 'Nepal', away: 'UAE', score: '124/4', status: 'Live' },
    { league: 'EPL', home: 'Arsenal', away: 'Liverpool', score: '20:45', status: 'Fixture' },
  ])
}

export async function getDisasterAlerts(): Promise<LiveDataEnvelope<AlertData[]>> {
  return mock('Mock disaster-alert provider, replace with DISASTER_ALERT_API_KEY provider', [
    { severity: 'watch', title: 'Monsoon preparedness notice', area: 'Bagmati Province' },
  ])
}

export const liveDataProviderNames = [
  'getWeather',
  'getAQI',
  'getNepseMarket',
  'getGoldSilverRates',
  'getForexRates',
  'getSportsScores',
  'getFootballScores',
  'getCricketScores',
  'getElectionResults',
  'getExamResults',
  'getDisasterAlerts',
  'getParliamentLive',
  'getYouTubeLiveStatus',
] as const
