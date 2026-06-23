/**
 * Live sports scores — provider-aware, with the same mock-fallback contract as the
 * rest of the live-data layer. Two providers are supported:
 *
 *   Football: football-data.org  (free tier, 10 req/min, covers FIFA World Cup + majors)
 *   Cricket:  api-sports.io      (free tier, 100 req/day, covers ICC + Nepal matches)
 *
 * When a provider's env vars are unset, the fetcher returns the existing mock values
 * (mock: true) so the widget never breaks and is honestly labelled. See
 * docs/sports-api-setup.md for key registration.
 *
 * Server-only: API keys live in process.env and must never reach the client.
 */
import 'server-only'
import type {
  CricketScore,
  FootballScore,
  LiveDataEnvelope,
} from '@/lib/live-data'

const TTL_MS = 60_000
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

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('sports-data timeout')), ms),
  )
  return Promise.race([promise, timer])
}

function mock<T>(source: string, data: T): LiveDataEnvelope<T> {
  return { status: 'mock', source, updatedAt: new Date().toISOString(), data }
}

const MOCK_FOOTBALL: FootballScore[] = [
  { league: 'FIFA World Cup 2026', home: 'Nepal', away: 'UAE', score: '—', minute: '', status: 'fixture' },
  { league: 'Premier League', home: 'Arsenal', away: 'Liverpool', score: '—', minute: '', status: 'fixture' },
]

const MOCK_CRICKET: CricketScore[] = [
  { league: 'Nepal tour', home: 'Nepal', away: 'UAE', score: '—', status: 'Upcoming' },
  { league: 'ICC T20', home: 'India', away: 'Australia', score: '—', status: 'Upcoming' },
]

type FootballDataMatch = {
  competition?: { name?: string }
  homeTeam?: { name?: string }
  awayTeam?: { name?: string }
  score?: { fullTime?: { homeTeam?: number | null; awayTeam?: number | null } }
  status?: string
  utcDate?: string
  matchday?: number
}

/** Football live scores. football-data.org free tier when keyed; mock otherwise. */
export async function getFootballScores(): Promise<LiveDataEnvelope<FootballScore[]>> {
  const key = 'football'
  const hit = cached<FootballScore[]>(key)
  if (hit) return hit

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return mock('Mock football — set FOOTBALL_API_KEY (see docs/sports-api-setup.md)', MOCK_FOOTBALL)
  }

  try {
    // WC 2000 (FIFA competitions id) + Premier League PL on free tier. Free tier exposes
    // a small set of competitions; WC 2026 is covered when in-session.
    const url = 'https://api.football-data.org/v4/matches?competitions=WC,PL'
    const res = await withTimeout(
      fetch(url, {
        headers: { 'X-Auth-Token': apiKey },
        next: { revalidate: 60 },
      }),
      5000,
    )
    if (!res.ok) throw new Error(`football http ${res.status}`)
    const j = (await res.json()) as { matches?: FootballDataMatch[] }
    const matches = j.matches ?? []
    const now = Date.now()
    const scores: FootballScore[] = matches
      .filter((m) => {
        const start = m.utcDate ? Date.parse(m.utcDate) : 0
        // Show fixtures in the next 2 days and anything live/finished today.
        return Math.abs(start - now) < 2 * 86_400_000 || m.status === 'IN' || m.status === 'PAUSED'
      })
      .slice(0, 10)
      .map((m) => {
        const home = m.score?.fullTime?.homeTeam
        const away = m.score?.fullTime?.awayTeam
        const hasScore = typeof home === 'number' && typeof away === 'number'
        const isLive = m.status === 'IN' || m.status === 'PAUSED'
        return {
          league: m.competition?.name ?? 'Football',
          home: m.homeTeam?.name ?? '?',
          away: m.awayTeam?.name ?? '?',
          score: hasScore ? `${home}-${away}` : '—',
          minute: isLive ? 'Live' : '',
          status: isLive ? ('live' as const) : ('fixture' as const),
        }
      })

    if (scores.length === 0) throw new Error('football empty')
    return remember(key, {
      status: 'ok',
      source: 'football-data.org',
      updatedAt: new Date().toISOString(),
      data: scores,
    })
  } catch (error) {
    return mock(
      `Mock football — ${error instanceof Error ? error.message : 'fetch failed'}`,
      MOCK_FOOTBALL,
    )
  }
}

type ApiSportsFixture = {
  league?: { name?: string }
  teams?: {
    home?: { name?: string }
    away?: { name?: string }
  }
  goals?: { home?: number | null; away?: number | null }
  fixture?: {
    status?: { short?: string; elapsed?: number | null }
    date?: string
  }
}

/** Cricket live scores. api-sports.io free tier when keyed; mock otherwise. */
export async function getCricketScores(): Promise<LiveDataEnvelope<CricketScore[]>> {
  const key = 'cricket'
  const hit = cached<CricketScore[]>(key)
  if (hit) return hit

  const apiKey = process.env.CRICKET_API_KEY
  if (!apiKey) {
    return mock('Mock cricket — set CRICKET_API_KEY (see docs/sports-api-setup.md)', MOCK_CRICKET)
  }

  try {
    // api-sports cricket. Free tier: 100 req/day. Fetch recent + upcoming fixtures.
    const url = 'https://v3.cricket.api-sports.io/fixtures?timezone=Asia/Kathmandu'
    const res = await withTimeout(
      fetch(url, {
        headers: { 'x-apisports-key': apiKey },
        next: { revalidate: 60 },
      }),
      5000,
    )
    if (!res.ok) throw new Error(`cricket http ${res.status}`)
    const j = (await res.json()) as { response?: ApiSportsFixture[] }
    const fixtures = j.response ?? []
    const scores: CricketScore[] = fixtures.slice(0, 10).map((f) => {
      const hg = f.goals?.home
      const ag = f.goals?.away
      const short = f.fixture?.status?.short ?? 'NS'
      const statusLabel: Record<string, string> = {
        NS: 'Upcoming',
        '1H': 'Live',
        '2H': 'Live',
        HT: 'Innings break',
        FT: 'Finished',
        LIVE: 'Live',
      }
      return {
        league: f.league?.name ?? 'Cricket',
        home: f.teams?.home?.name ?? '?',
        away: f.teams?.away?.name ?? '?',
        score:
          typeof hg === 'number' && typeof ag === 'number' ? `${hg}/${ag}` : '—',
        status: statusLabel[short] ?? short,
      }
    })

    if (scores.length === 0) throw new Error('cricket empty')
    return remember(key, {
      status: 'ok',
      source: 'api-sports.io',
      updatedAt: new Date().toISOString(),
      data: scores,
    })
  } catch (error) {
    return mock(
      `Mock cricket — ${error instanceof Error ? error.message : 'fetch failed'}`,
      MOCK_CRICKET,
    )
  }
}

/** Whether the configured sports providers would return live (non-mock) data. */
export function sportsConfigured(): { football: boolean; cricket: boolean } {
  return {
    football: Boolean(process.env.FOOTBALL_API_KEY),
    cricket: Boolean(process.env.CRICKET_API_KEY),
  }
}
