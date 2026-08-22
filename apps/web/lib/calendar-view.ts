import { bsToAd } from '@nagarikwatch/db'

export type PublishedCalendarEvent = {
  month: number
  day: number
  nameNe: string
  nameEn: string
  holiday?: boolean
}

export type PublishedCalendarSchedule = {
  year: number
  source: string
  updatedAt: string
  events: PublishedCalendarEvent[]
}

export type UpcomingPublishedCalendarEvent = PublishedCalendarEvent & {
  year: number
  daysUntil: number
}

export function upcomingFromSchedule(
  schedule: PublishedCalendarSchedule | null,
  from: { year: number; month: number; day: number },
  limit: number,
): UpcomingPublishedCalendarEvent[] {
  if (!schedule || schedule.year !== from.year || limit <= 0) return []
  const fromAd = bsToAd(from.year, from.month, from.day)
  if (!fromAd) return []

  const fromUtc = Date.UTC(fromAd.getUTCFullYear(), fromAd.getUTCMonth(), fromAd.getUTCDate())
  return schedule.events
    .map((event) => {
      const ad = bsToAd(schedule.year, event.month, event.day)
      if (!ad) return null
      const eventUtc = Date.UTC(ad.getUTCFullYear(), ad.getUTCMonth(), ad.getUTCDate())
      return {
        ...event,
        year: schedule.year,
        daysUntil: Math.round((eventUtc - fromUtc) / 86_400_000),
      }
    })
    .filter((event): event is UpcomingPublishedCalendarEvent =>
      Boolean(event && event.daysUntil >= 0),
    )
    .sort((a, b) => a.daysUntil - b.daysUntil || a.nameNe.localeCompare(b.nameNe, 'ne'))
    .slice(0, limit)
}
