import type { ReaderPreferences } from './preferences-store'

export const READER_PREFERENCES_KEY = 'nagarik-watch:reader-preferences:v2'
export const READER_PREFERENCES_EVENT = 'nw-reader-preferences-change'

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map(String)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 50)
}

function hour(value: unknown, fallback: number | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23 ? parsed : fallback
}

function normalize(value: unknown): ReaderPreferences | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Partial<ReaderPreferences>
  return {
    categories: list(input.categories),
    tags: list(input.tags),
    authors: list(input.authors),
    provinces: list(input.provinces),
    breaking: input.breaking !== false,
    followedTopics: input.followedTopics !== false,
    followedAuthors: input.followedAuthors !== false,
    dailyDigest: Boolean(input.dailyDigest),
    browserAlerts: Boolean(input.browserAlerts),
    quietStart: hour(input.quietStart, 22),
    quietEnd: hour(input.quietEnd, 7),
    timeZone:
      typeof input.timeZone === 'string' && input.timeZone.trim()
        ? input.timeZone.trim()
        : 'Asia/Kathmandu',
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : new Date(0).toISOString(),
  }
}

export function readLocalReaderPreferences(): ReaderPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const current = normalize(JSON.parse(localStorage.getItem(READER_PREFERENCES_KEY) ?? 'null'))
    if (current) return current
    const legacy = normalize(
      JSON.parse(localStorage.getItem('nagarik-watch:reader-preferences:v1') ?? 'null'),
    )
    if (legacy) writeLocalReaderPreferences(legacy)
    return legacy
  } catch {
    return null
  }
}

export function writeLocalReaderPreferences(preferences: ReaderPreferences) {
  if (typeof window === 'undefined') return
  localStorage.setItem(READER_PREFERENCES_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new Event(READER_PREFERENCES_EVENT))
}
