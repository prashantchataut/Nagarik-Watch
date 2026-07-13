/**
 * Provider-aware live sports scores.
 *
 * Football uses football-data.org. Cricket uses the configured API-Sports-compatible
 * endpoint. When credentials are absent or an upstream fails, the service checks the
 * newsroom's verified manual override and otherwise returns an attributed empty/error
 * state. It never fabricates a score.
 *
 * Server-only: provider credentials live in process.env and never reach the client.
 */
import 'server-only'
import type { CricketScore, FootballScore, LiveDataEnvelope } from '@/lib/live/types'
import { getManualLiveRecord } from '@/lib/live/manual'

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

function unavailable<T>(source: string, error?: string): LiveDataEnvelope<T[]> {
  return { status: error ? 'error' : 'empty', source, updatedAt: new Date().toISOString(), data: [], error }
}

type FootballDataMatch = {
  competition?: { name?: string }
  homeTeam?: { name?: string }
  awayTeam?: { name?: string }
  score?: { fullTime?: { homeTeam?: number | null; awayTeam?: number | null } }
  status?: string
  utcDate?: string
  matchday?: number
}

/** Football live scores with verified manual fallback. */
export async function getFootballScores(): Promise<LiveDataEnvelope<FootballScore[]>> {
  const key = 'football'
  const hit = cached<FootballScore[]>(key)
  if (hit) return hit

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    const manual = await getManualLiveRecord<FootballScore[]>('football')
    if (manual) return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
    return unavailable<FootballScore>('Football provider is not configured')
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
    const manual = await getManualLiveRecord<FootballScore[]>('football')
    if (manual) return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
    return unavailable<FootballScore>('football-data.org', error instanceof Error ? error.message : 'Football fetch failed')
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

/** Cricket live scores with verified manual fallback. */
export async function getCricketScores(): Promise<LiveDataEnvelope<CricketScore[]>> {
  const key = 'cricket'
  const hit = cached<CricketScore[]>(key)
  if (hit) return hit

  const apiKey = process.env.CRICKET_API_KEY
  if (!apiKey) {
    const manual = await getManualLiveRecord<CricketScore[]>('cricket')
    if (manual) return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
    return unavailable<CricketScore>('Cricket provider is not configured')
  }

  try {
    // api-sports cricket. Free tier: 100 req/day. Fetch recent + upcoming fixtures.
    const base = process.env.CRICKET_API_BASE ?? 'https://v1.cricket.api-sports.io'
    const url = `${base.replace(/\/$/, '')}/fixtures?timezone=Asia/Kathmandu`
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
        score: typeof hg === 'number' && typeof ag === 'number' ? `${hg}/${ag}` : '—',
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
    const manual = await getManualLiveRecord<CricketScore[]>('cricket')
    if (manual) return { status: 'ok', source: manual.source, updatedAt: manual.updatedAt, data: manual.data }
    return unavailable<CricketScore>('Configured cricket provider', error instanceof Error ? error.message : 'Cricket fetch failed')
  }
}

/** Whether external sports providers are configured. Manual newsroom entries may still be available. */
export function sportsConfigured(): { football: boolean; cricket: boolean } {
  return {
    football: Boolean(process.env.FOOTBALL_API_KEY),
    cricket: Boolean(process.env.CRICKET_API_KEY),
  }
}
