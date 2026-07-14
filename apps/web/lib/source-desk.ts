import 'server-only'
import { unstable_cache } from 'next/cache'
import { fetchAggregatedFeed, INGEST_SOURCES } from '@nagarikwatch/ingest'

const cachedFeed = unstable_cache(
  async () => fetchAggregatedFeed(INGEST_SOURCES, 40),
  ['nagarik-watch-source-desk-v1'],
  { revalidate: 300, tags: ['source-desk'] },
)

export async function getSourceDeskHeadlines(limit = 8) {
  const safeLimit = Math.max(1, Math.min(limit, 20))
  try {
    return (await cachedFeed()).slice(0, safeLimit)
  } catch {
    return []
  }
}
