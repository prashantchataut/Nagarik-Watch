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

export async function getFootballScores(): Promise<LiveDataEnvelope<FootballScore[]>> {
  return mock('Mock football provider, replace with FOOTBALL_API_KEY provider', [
    {
      league: 'EPL',
      home: 'Arsenal',
      away: 'Liverpool',
      score: '1-1',
      minute: '67',
      status: 'live',
    },
    {
      league: 'La Liga',
      home: 'Barcelona',
      away: 'Real Madrid',
      score: '20:45',
      minute: '',
      status: 'fixture',
    },
  ])
}

export async function getCricketScores(): Promise<LiveDataEnvelope<CricketScore[]>> {
  return mock('Mock cricket provider, replace with CRICKET_API_KEY provider', [
    { league: 'Nepal Cricket', home: 'Nepal', away: 'UAE', score: '124/4 (14.2)', status: 'Live' },
    {
      league: 'T20 World Cup',
      home: 'India',
      away: 'Australia',
      score: '180/6',
      status: 'Innings break',
    },
  ])
}

export async function getElectionResults(): Promise<LiveDataEnvelope<ElectionResult[]>> {
  return mock('Mock election provider, replace with ELECTION_API_KEY provider', [
    {
      region: 'Nepal',
      body: 'Federal Parliament',
      reportedPercent: 0,
      summary: 'No active election',
    },
  ])
}

export async function getExamResults(): Promise<LiveDataEnvelope<ExamResult[]>> {
  return mock('Mock exam-results provider, replace with EXAM_RESULTS_API_KEY provider', [
    { exam: 'SEE', board: 'NEB', publishedOn: '', summary: 'No result published' },
    { exam: 'Grade XII', board: 'NEB', publishedOn: '', summary: 'No result published' },
  ])
}

export async function getParliamentLive(): Promise<LiveDataEnvelope<ParliamentLiveStatus>> {
  return mock('Mock parliament-feed provider, replace with PARLIAMENT_LIVE_URL provider', {
    inSession: false,
    title: 'Parliament not in session',
  })
}

export async function getYouTubeLiveStatus(): Promise<LiveDataEnvelope<YouTubeLiveStatus>> {
  return mock('Mock YouTube provider, replace with YOUTUBE_API_KEY provider', {
    channelId: '',
    isLive: false,
    title: 'No live stream scheduled',
  })
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
