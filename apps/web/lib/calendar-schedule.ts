import { bsToAd } from '@nagarikwatch/db'
import { getManualLiveRecord } from '@/lib/live/manual'
import { validateManualLiveData } from '@/lib/live/manual-schema'
import type { PublishedCalendarEvent, PublishedCalendarSchedule } from '@/lib/calendar-view'

export type {
  PublishedCalendarEvent,
  PublishedCalendarSchedule,
  UpcomingPublishedCalendarEvent,
} from '@/lib/calendar-view'
export { upcomingFromSchedule } from '@/lib/calendar-view'

export async function getPublishedCalendarSchedule(): Promise<PublishedCalendarSchedule | null> {
  const record = await getManualLiveRecord<unknown>('calendar-schedule').catch(() => null)
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

function isMeaningfulSource(source: string): boolean {
  const value = source.trim().toLowerCase()
  return (
    Boolean(value) &&
    value !== 'newsroom manual update' &&
    value !== 'manual' &&
    value !== 'unknown'
  )
}
