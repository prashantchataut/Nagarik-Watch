import type { Locale } from '@nagarikwatch/db'
import { ReaderPlaceLive } from '@/components/live/ReaderPlaceLive'
import { getRealNepse } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'

type UtilityStripProps = {
  locale: Locale
}

export async function UtilityStrip({ locale }: UtilityStripProps) {
  const nepse = await getRealNepse(locale)
  const en = locale === 'en'
  const updated = nepse.updatedAt ? relativeTime(nepse.updatedAt, locale) : null
  const data = nepse.data

  return (
    <div className="border-b border-rule bg-surface-raised overflow-visible">
      <div className="mx-auto max-w-page px-3 sm:px-4">
        <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="shrink-0 text-caption font-bold text-brand-strong">
              {en ? 'Markets' : 'बजार'}
            </span>
            {data ? (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-ink">
                <span className="font-semibold">{en ? 'NEPSE' : 'नेप्से'}</span>
                <span className="font-bold tabular-nums">
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
                  {localizeNumber(data.change.toFixed(2), locale)} (
                  {data.changePercent >= 0 ? '+' : ''}
                  {localizeNumber(data.changePercent.toFixed(2), locale)}%)
                </span>
              </span>
            ) : (
              <span className="text-caption text-ink-soft">
                {en ? 'Market feed unavailable' : 'बजार डेटा उपलब्ध छैन'}
              </span>
            )}
          </div>

          <span className="hidden h-4 w-px shrink-0 bg-rule sm:block" aria-hidden />

          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-3">
            <ReaderPlaceLive locale={locale} variant="strip" />
            {updated ? (
              <p className="mt-1 shrink-0 text-caption text-ink-soft sm:mt-0">
                {updated}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
