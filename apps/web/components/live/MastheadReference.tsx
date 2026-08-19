import type { Locale } from '@nagarikwatch/db'
import { ReaderPlaceLive } from '@/components/live/ReaderPlaceLive'
import { getRealNepse } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'

type MastheadReferenceProps = {
  locale: Locale
}

/**
 * Live reference inside the masthead row: weather, then NEPSE when the feed is
 * up. It sits here rather than in its own band because a full-width strip
 * holding one weather chip reads as an unfinished page. Widths step up with the
 * viewport so a real leaderboard still has room.
 *
 * When NEPSE is unavailable the markets group is omitted entirely — a permanent
 * "unavailable" line under the brand reads as a broken portal.
 */
export async function MastheadReference({ locale }: MastheadReferenceProps) {
  const nepse = await getRealNepse(locale)
  const en = locale === 'en'
  const data = nepse.data
  const updated = nepse.updatedAt ? relativeTime(nepse.updatedAt, locale) : null

  return (
    <div className="hidden min-w-0 items-center gap-x-2.5 border-l border-chrome-rule pl-3.5 lg:flex">
      <ReaderPlaceLive locale={locale} variant="chrome" />

      {data ? (
        <>
          <span className="hidden h-4 w-px shrink-0 bg-chrome-rule xl:block" aria-hidden="true" />
          <span className="hidden min-w-0 items-center gap-x-1.5 text-caption xl:inline-flex">
            <span className="font-bold text-on-chrome" lang={en ? 'en' : 'ne'}>
              {en ? 'NEPSE' : 'नेप्से'}
            </span>
            <span className="font-bold tabular-nums text-on-chrome">
              {localizeNumber(data.index.toFixed(2), locale)}
            </span>
            <span
              className={
                data.change >= 0
                  ? 'font-semibold tabular-nums text-up'
                  : 'font-semibold tabular-nums text-down'
              }
            >
              {data.change >= 0 ? '+' : ''}
              {localizeNumber(data.changePercent.toFixed(2), locale)}%
            </span>
          </span>
          {updated ? (
            <span className="hidden shrink-0 text-[0.68rem] text-on-chrome-soft 2xl:inline">
              {updated}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
