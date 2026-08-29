import 'server-only'
import type { CricketScore, FootballScore, LiveDataEnvelope } from '@/lib/live/types'
import { getManualLiveRecord } from '@/lib/live/manual'

const TTL_MS = 60_000
const FETCH_TIMEOUT_MS = 5_000

type CacheEntry = { at: number; value: LiveDataEnvelope<unknown> }
const cache = new Map<string, CacheEntry>()

function cached<T>(key: string): LiveDataEnvelope<T> | null {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as LiveDataEnvelope<T>
  return null
}

function remember<T>(key: string, value: LiveDataEnvelope<T>): LiveDataEnvelope<T> {
  cache.set(key, { at: Date.now(), value })
  return value
}

function unavailable<T>(source: string, error?: string): LiveDataEnvelope<T[]> {
  return {
    status: error ? 'error' : 'empty',
    source,
    updatedAt: new Date().toISOString(),
    data: [],
    error,
  }
}

function configuredProvider(value: string | undefined, fallback: string): string {
  return value?.trim().toLowerCase() || fallback
}

function todayKathmandu(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function providerFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    cache: 'no-store',
    signal: init.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })
}

async function manualFootball(): Promise<LiveDataEnvelope<FootballScore[]> | null> {
  const manual = await getManualLiveRecord<FootballScore[]>('football')
  if (!manual) return null
  return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
}

async function manualCricket(): Promise<LiveDataEnvelope<CricketScore[]> | null> {
  const manual = await getManualLiveRecord<CricketScore[]>('cricket')
  if (!manual) return null
  return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
}

type FootballDataMatch = {
  competition?: { name?: string }
  homeTeam?: { name?: string }
  awayTeam?: { name?: string }
  score?: {
    fullTime?: {
      home?: number | null
      away?: number | null
      homeTeam?: number | null
      awayTeam?: number | null
    }
  }
  status?: string
  utcDate?: string
  minute?: number | null
}

function footballDataScore(match: FootballDataMatch): FootballScore {
  const fullTime = match.score?.fullTime
  const home = fullTime?.home ?? fullTime?.homeTeam
  const away = fullTime?.away ?? fullTime?.awayTeam
  const status = match.status?.toUpperCase() || 'SCHEDULED'
  const live = status === 'LIVE' || status === 'IN_PLAY' || status === 'PAUSED'
  const finished = status === 'FINISHED'
  return {
    league: match.competition?.name ?? 'Football',
    home: match.homeTeam?.name ?? '?',
    away: match.awayTeam?.name ?? '?',
    score: typeof home === 'number' && typeof away === 'number' ? `${home}-${away}` : '—',
    minute: live ? (typeof match.minute === 'number' ? `${match.minute}′` : 'Live') : '',
    status: live ? 'live' : finished ? 'finished' : 'fixture',
  }
}

async function fetchFootballData(apiKey: string): Promise<FootballScore[]> {
  const base = (process.env.FOOTBALL_DATA_API_BASE || process.env.FOOTBALL_API_BASE || 'https://api.football-data.org').replace(/\/$/, '')
  const dateFrom = todayKathmandu()
  const tomorrow = new Date(Date.now() + 86_400_000)
  const dateTo = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow)
  const params = new URLSearchParams({ dateFrom, dateTo })
  const competitions = process.env.FOOTBALL_COMPETITIONS?.trim()
  if (competitions) params.set('competitions', competitions)
  const response = await providerFetch(`${base}/v4/matches?${params}`, {
    headers: { 'X-Auth-Token': apiKey },
  })
  if (!response.ok) throw new Error(`football-data.org returned ${response.status}`)
  const body = (await response.json()) as { matches?: FootballDataMatch[] }
  return (body.matches ?? []).slice(0, 12).map(footballDataScore)
}

type ApiFootballFixture = {
  fixture?: {
    status?: { short?: string; long?: string; elapsed?: number | null }
    date?: string
  }
  league?: { name?: string }
  teams?: { home?: { name?: string }; away?: { name?: string } }
  goals?: { home?: number | null; away?: number | null }
}

const API_FOOTBALL_LIVE = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const API_FOOTBALL_FINISHED = new Set(['FT', 'AET', 'PEN'])

function apiFootballScore(match: ApiFootballFixture): FootballScore {
  const short = match.fixture?.status?.short?.toUpperCase() || 'NS'
  const elapsed = match.fixture?.status?.elapsed
  const home = match.goals?.home
  const away = match.goals?.away
  const live = API_FOOTBALL_LIVE.has(short)
  const finished = API_FOOTBALL_FINISHED.has(short)
  return {
    league: match.league?.name ?? 'Football',
    home: match.teams?.home?.name ?? '?',
    away: match.teams?.away?.name ?? '?',
    score: typeof home === 'number' && typeof away === 'number' ? `${home}-${away}` : '—',
    minute: live
      ? typeof elapsed === 'number'
        ? `${elapsed}′`
        : match.fixture?.status?.long || 'Live'
      : match.fixture?.status?.long || '',
    status: live ? 'live' : finished ? 'finished' : 'fixture',
  }
}

async function apiFootballRequest(base: string, apiKey: string, query: string) {
  const response = await providerFetch(`${base}/fixtures?${query}`, {
    headers: { 'x-apisports-key': apiKey },
  })
  if (!response.ok) throw new Error(`API-Football returned ${response.status}`)
  const body = (await response.json()) as { response?: ApiFootballFixture[]; errors?: unknown }
  return body.response ?? []
}

async function fetchApiFootball(apiKey: string): Promise<FootballScore[]> {
  const base = (process.env.API_FOOTBALL_API_BASE || process.env.FOOTBALL_API_BASE || 'https://v3.football.api-sports.io').replace(
    /\/$/,
    '',
  )
  let fixtures = await apiFootballRequest(base, apiKey, 'live=all')
  if (fixtures.length === 0) {
    const params = new URLSearchParams({ date: todayKathmandu(), timezone: 'Asia/Kathmandu' })
    fixtures = await apiFootballRequest(base, apiKey, params.toString())
  }
  return fixtures.slice(0, 12).map(apiFootballScore)
}

export async function getFootballScores(): Promise<LiveDataEnvelope<FootballScore[]>> {
  const provider = configuredProvider(process.env.FOOTBALL_PROVIDER, 'football-data')
  const cacheKey = `football:${provider}`
  const hit = cached<FootballScore[]>(cacheKey)
  if (hit) return hit
  const apiKey = process.env.FOOTBALL_API_KEY?.trim()
  if (!apiKey) return (await manualFootball()) ?? unavailable<FootballScore>(provider)

  try {
    const scores =
      provider === 'api-football' || provider === 'api-sports'
        ? await fetchApiFootball(apiKey)
        : await fetchFootballData(apiKey)
    if (scores.length === 0) throw new Error('No football fixtures returned for the active window')
    return remember(cacheKey, {
      status: 'ok',
      source: provider === 'api-football' || provider === 'api-sports' ? 'API-Football' : 'football-data.org',
      updatedAt: new Date().toISOString(),
      data: scores,
    })
  } catch (error) {
    return (
      (await manualFootball()) ??
      unavailable<FootballScore>(
        provider === 'api-football' || provider === 'api-sports' ? 'API-Football' : 'football-data.org',
        error instanceof Error ? error.message : 'Football provider failed',
      )
    )
  }
}

type CricketDataInnings = {
  r?: number | null
  w?: number | null
  o?: number | null
  inning?: string
}

type CricketDataMatch = {
  name?: string
  matchType?: string
  status?: string
  teams?: string[]
  score?: CricketDataInnings[]
}

function inningsValue(innings: CricketDataInnings): string {
  if (typeof innings.r !== 'number') return '—'
  const wickets = typeof innings.w === 'number' ? `/${innings.w}` : ''
  const overs = typeof innings.o === 'number' ? ` (${innings.o})` : ''
  return `${innings.r}${wickets}${overs}`
}

function cricketDataSideScore(team: string, scores: CricketDataInnings[]): string | null {
  const token = team.toLowerCase().split(/\s+/).filter(Boolean)[0]
  const matching = scores.filter((inning) =>
    token ? inning.inning?.toLowerCase().includes(token) : false,
  )
  if (matching.length === 0) return null
  return matching.map(inningsValue).join(' & ')
}

function cricketDataScore(match: CricketDataMatch): CricketScore {
  const home = match.teams?.[0] ?? 'Team 1'
  const away = match.teams?.[1] ?? 'Team 2'
  const scores = match.score ?? []
  const homeScore = cricketDataSideScore(home, scores)
  const awayScore = cricketDataSideScore(away, scores)
  const fallbackScores = scores.slice(-2).map(inningsValue).filter((value) => value !== '—')
  return {
    league: match.matchType?.toUpperCase() || 'Cricket',
    home,
    away,
    score:
      homeScore || awayScore
        ? `${homeScore ?? '—'} · ${awayScore ?? '—'}`
        : fallbackScores.join(' · ') || '—',
    status: match.status?.trim() || match.name?.trim() || 'Scheduled',
  }
}

async function fetchCricketData(apiKey: string): Promise<CricketScore[]> {
  const base = (process.env.CRICKETDATA_API_BASE || process.env.CRICKET_API_BASE || 'https://api.cricapi.com/v1').replace(/\/$/, '')
  const params = new URLSearchParams({ apikey: apiKey, offset: '0' })
  const response = await providerFetch(`${base}/currentMatches?${params}`)
  if (!response.ok) throw new Error(`CricketData returned ${response.status}`)
  const body = (await response.json()) as { data?: CricketDataMatch[]; status?: string; reason?: string }
  if (body.status && body.status !== 'success' && !body.data?.length) {
    throw new Error(body.reason || `CricketData status ${body.status}`)
  }
  return (body.data ?? []).slice(0, 12).map(cricketDataScore)
}

type SportmonksRun = {
  team_id?: number
  score?: number | null
  wickets?: number | null
  overs?: number | null
  inning?: number
}

type SportmonksFixture = {
  round?: string
  type?: string
  status?: string
  note?: string
  live?: boolean
  localteam_id?: number
  visitorteam_id?: number
  localteam?: { id?: number; name?: string }
  visitorteam?: { id?: number; name?: string }
  league?: { name?: string }
  runs?: SportmonksRun[]
}

function sportmonksSideScore(teamId: number | undefined, runs: SportmonksRun[]): string {
  const innings = runs.filter((run) => run.team_id === teamId)
  if (innings.length === 0) return '—'
  return innings
    .map((run) => {
      if (typeof run.score !== 'number') return '—'
      const wickets = typeof run.wickets === 'number' ? `/${run.wickets}` : ''
      const overs = typeof run.overs === 'number' ? ` (${run.overs})` : ''
      return `${run.score}${wickets}${overs}`
    })
    .join(' & ')
}

function sportmonksScore(match: SportmonksFixture): CricketScore {
  const runs = match.runs ?? []
  const homeId = match.localteam?.id ?? match.localteam_id
  const awayId = match.visitorteam?.id ?? match.visitorteam_id
  return {
    league: match.league?.name || match.round || match.type || 'Cricket',
    home: match.localteam?.name ?? 'Team 1',
    away: match.visitorteam?.name ?? 'Team 2',
    score: `${sportmonksSideScore(homeId, runs)} · ${sportmonksSideScore(awayId, runs)}`,
    status: match.note || match.status || (match.live ? 'Live' : 'Scheduled'),
  }
}

async function fetchSportmonksCricket(apiKey: string): Promise<CricketScore[]> {
  const base = (process.env.SPORTMONKS_CRICKET_API_BASE || process.env.CRICKET_API_BASE || 'https://cricket.sportmonks.com/api/v2.0').replace(
    /\/$/,
    '',
  )
  const params = new URLSearchParams({
    api_token: apiKey,
    include: 'localteam,visitorteam,runs,league',
  })
  const response = await providerFetch(`${base}/livescores?${params}`)
  if (!response.ok) throw new Error(`Sportmonks Cricket returned ${response.status}`)
  const body = (await response.json()) as { data?: SportmonksFixture[] }
  return (body.data ?? []).slice(0, 12).map(sportmonksScore)
}

export async function getCricketScores(): Promise<LiveDataEnvelope<CricketScore[]>> {
  const provider = configuredProvider(process.env.CRICKET_PROVIDER, 'cricketdata')
  const cacheKey = `cricket:${provider}`
  const hit = cached<CricketScore[]>(cacheKey)
  if (hit) return hit
  const apiKey = process.env.CRICKET_API_KEY?.trim()
  if (!apiKey) return (await manualCricket()) ?? unavailable<CricketScore>(provider)

  try {
    const scores =
      provider === 'sportmonks'
        ? await fetchSportmonksCricket(apiKey)
        : await fetchCricketData(apiKey)
    if (scores.length === 0) throw new Error('No cricket matches returned by the provider')
    return remember(cacheKey, {
      status: 'ok',
      source: provider === 'sportmonks' ? 'Sportmonks Cricket' : 'CricketData (CricAPI)',
      updatedAt: new Date().toISOString(),
      data: scores,
    })
  } catch (error) {
    return (
      (await manualCricket()) ??
      unavailable<CricketScore>(
        provider === 'sportmonks' ? 'Sportmonks Cricket' : 'CricketData (CricAPI)',
        error instanceof Error ? error.message : 'Cricket provider failed',
      )
    )
  }
}

export function sportsConfigured(): { football: boolean; cricket: boolean } {
  return {
    football: Boolean(process.env.FOOTBALL_API_KEY?.trim()),
    cricket: Boolean(process.env.CRICKET_API_KEY?.trim()),
  }
}
