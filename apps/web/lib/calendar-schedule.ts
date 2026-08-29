import { bsToAd, todayBsInKathmandu } from '@nagarikwatch/db'
import { fetchCalendarScheduleFromProvider, getCalendarProviderState } from '@/lib/calendar-provider'
import { getManualLiveRecord } from '@/lib/live/manual'
import { validateManualLiveData } from '@/lib/live/manual-schema'
import type { PublishedCalendarEvent, PublishedCalendarSchedule } from '@/lib/calendar-view'

export type {
  PublishedCalendarEvent,
  PublishedCalendarSchedule,
  UpcomingPublishedCalendarEvent,
} from '@/lib/calendar-view'
export { upcomingFromSchedule } from '@/lib/calendar-view'

function storedSchedule(record: Awaited<ReturnType<typeof getManualLiveRecord<unknown>>>): PublishedCalendarSchedule | null {
  if (!record) return null
  if (!validateManualLiveData('calendar-schedule', record.data).ok) return null
  if (!isMeaningfulSource(record.source)) return null
  const raw = record.data as { year: number; events: PublishedCalendarEvent[] }
  const events = raw.events.filter((event) => Boolean(bsToAd(raw.year, event.month, event.day)))
  if (events.length !== raw.events.length) return null
  return {
    year: raw.year,
    source: record.source.trim(),
    updatedAt: record.updatedAt,
    events: events.slice().sort((a, b) => a.month - b.month || a.day - b.day),
  }
}

export async function getPublishedCalendarSchedule(): Promise<PublishedCalendarSchedule | null> {
  const year = todayBsInKathmandu().year
  const record = await getManualLiveRecord<unknown>('calendar-schedule').catch(() => null)
  const stored = storedSchedule(record)
  const currentStored = stored?.year === year ? stored : null
  const maxAgeHours = Math.max(1, Number(process.env.CALENDAR_MAX_STALE_HOURS || 36))
  const storedAgeMs = currentStored ? Date.now() - new Date(currentStored.updatedAt).getTime() : Number.POSITIVE_INFINITY
  if (currentStored && Number.isFinite(storedAgeMs) && storedAgeMs <= maxAgeHours * 3_600_000) {
    return currentStored
  }

  const provider = getCalendarProviderState()
  if (provider.configured) {
    const live = await fetchCalendarScheduleFromProvider(year).catch(() => null)
    if (live) return live
  }

  return currentStored
}

function isMeaningfulSource(source: string): boolean {
  const value = source.trim().toLowerCase()
  return Boolean(value) && value !== 'newsroom manual update' && value !== 'manual' && value !== 'unknown'
}
