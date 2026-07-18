import 'server-only'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'
import {
  normalizeSearchQuery,
  sanitizeSearchQuery,
  validSearchResultCount,
} from './search-analytics-core'

type SearchEvent = {
  query: string
  normalizedQuery: string
  resultCount: number
  locale: 'ne' | 'en'
  at: string
}

export type SearchAnalyticsSummary = {
  totalSearches: number
  zeroResultSearches: number
  zeroResultRate: number
  topQueries: Array<{ query: string; searches: number; averageResults: number }>
  zeroResultQueries: Array<{ query: string; searches: number }>
}

const SCHEMA_KEY = 'nw-search-analytics-v1'
const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'search-analytics.json')
let localCache: SearchEvent[] | null = null
let localWrite = Promise.resolve()

async function ensureTable(pool: Queryable): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_search_events (
      id BIGSERIAL PRIMARY KEY,
      query_text TEXT NOT NULL,
      normalized_query TEXT NOT NULL,
      result_count INTEGER NOT NULL,
      locale TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS nw_search_events_query_at_idx
     ON nw_search_events (normalized_query, created_at DESC)`,
  )
}

async function readLocal(): Promise<SearchEvent[]> {
  if (localCache) return localCache
  try {
    localCache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as SearchEvent[]
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    localCache = []
  }
  return localCache
}

async function writeLocal(events: SearchEvent[]): Promise<void> {
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    await fs.writeFile(LOCAL_FILE, JSON.stringify(events.slice(-20_000)), 'utf8')
    localCache = events
  })
  await localWrite
}

export async function recordSearchEvent(input: {
  query: unknown
  resultCount: unknown
  locale: unknown
}): Promise<boolean> {
  const query = sanitizeSearchQuery(input.query)
  const normalizedQuery = normalizeSearchQuery(input.query)
  if (normalizedQuery.length < 2) return false
  const resultCount = validSearchResultCount(input.resultCount)
  const locale = input.locale === 'en' ? 'en' : 'ne'

  const pool = await ensureOperationalSchema(SCHEMA_KEY, ensureTable)
  if (pool) {
    await pool.query(
      `INSERT INTO nw_search_events (query_text, normalized_query, result_count, locale)
       VALUES ($1, $2, $3, $4)`,
      [query, normalizedQuery, resultCount, locale],
    )
    return true
  }
  if (isProductionRuntime()) {
    throw new Error('Search analytics requires Postgres in production.')
  }
  const events = await readLocal()
  events.push({
    query,
    normalizedQuery,
    resultCount,
    locale,
    at: new Date().toISOString(),
  })
  await writeLocal(events)
  return true
}

function aggregate(events: SearchEvent[]): SearchAnalyticsSummary {
  const byQuery = new Map<
    string,
    { query: string; searches: number; resultSum: number; zeroResults: number }
  >()
  for (const event of events) {
    const current = byQuery.get(event.normalizedQuery) ?? {
      query: event.query,
      searches: 0,
      resultSum: 0,
      zeroResults: 0,
    }
    current.searches += 1
    current.resultSum += event.resultCount
    if (event.resultCount === 0) current.zeroResults += 1
    byQuery.set(event.normalizedQuery, current)
  }
  const totalSearches = events.length
  const zeroResultSearches = events.filter((event) => event.resultCount === 0).length
  const values = [...byQuery.values()]
  return {
    totalSearches,
    zeroResultSearches,
    zeroResultRate: totalSearches > 0 ? zeroResultSearches / totalSearches : 0,
    topQueries: [...values]
      .sort((a, b) => b.searches - a.searches || b.resultSum - a.resultSum)
      .slice(0, 20)
      .map((item) => ({
        query: item.query,
        searches: item.searches,
        averageResults: item.resultSum / item.searches,
      })),
    zeroResultQueries: values
      .filter((item) => item.zeroResults > 0)
      .sort((a, b) => b.zeroResults - a.zeroResults)
      .slice(0, 20)
      .map((item) => ({ query: item.query, searches: item.zeroResults })),
  }
}

export async function getSearchAnalyticsSummary(days = 30): Promise<SearchAnalyticsSummary> {
  const cutoff = new Date(Date.now() - Math.max(1, Math.min(365, days)) * 86_400_000)
  const pool = await ensureOperationalSchema(SCHEMA_KEY, ensureTable)
  if (pool) {
    const result = await pool.query<{
      query_text: string
      normalized_query: string
      result_count: number
      locale: 'ne' | 'en'
      created_at: Date | string
    }>(
      `SELECT query_text, normalized_query, result_count, locale, created_at
       FROM nw_search_events
       WHERE created_at >= $1
       ORDER BY created_at DESC
       LIMIT 50000`,
      [cutoff.toISOString()],
    )
    return aggregate(
      result.rows.map((row) => ({
        query: row.query_text,
        normalizedQuery: row.normalized_query,
        resultCount: Number(row.result_count),
        locale: row.locale,
        at: new Date(row.created_at).toISOString(),
      })),
    )
  }
  return aggregate(
    (await readLocal()).filter((event) => Date.parse(event.at) >= cutoff.getTime()),
  )
}

