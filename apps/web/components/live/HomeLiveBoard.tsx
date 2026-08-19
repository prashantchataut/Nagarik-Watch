/**
 * DEPRECATED — DO NOT MOUNT ON HOMEPAGE.
 * Live reference lives only in MastheadReference (one band; no strip + card-grid duplicate).
 */
import type { Locale } from '@nagarikwatch/db'
import { LiveWidget } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getRealNepse, getRealForex } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'
import { ReaderPlaceLive } from '@/components/live/ReaderPlaceLive'

/**
 * Homepage live row: place-aware weather/AQI (client, so static export can personalize),
 * plus NEPSE and NRB forex from server providers.
 */
export async function HomeLiveBoard({ locale, className }: { locale: Locale; className?: string }) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const labels = {
    mock: dict.liveMock,
    sourcePrefix: dict.liveSourcePrefix,
    loading: dict.liveLoading,
    error: dict.liveError,
    empty: dict.liveEmpty,
    retry: dict.liveRetry,
  }

  const nepse = await getRealNepse(locale)
  const forex = await getRealForex(locale)
  const showMock = true

  return (
    <section className={className} aria-label={lang === 'ne' ? 'लाइभ जानकारी' : 'Live information'}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ReaderPlaceLive locale={locale} variant="board" />

        <LiveWidget
          title={dict.nepseTitle}
          titleLang="en"
          status={nepse.status}
          source={sourceFor(nepse.source, locale)}
          updatedLabel={relativeTime(nepse.updatedAt, locale)}
          mock={showMock && nepse.mock}
          tone={nepse.data && nepse.data.change >= 0 ? 'up' : 'down'}
          href={`${locale === 'en' ? '/en' : ''}/search?q=NEPSE`}
          labels={labels}
        >
          {nepse.data ? (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-h2 font-bold text-ink">
                {localizeNumber(nepse.data.index.toFixed(2), locale)}
              </span>
              <NepseDelta
                value={nepse.data.changePercent}
                points={nepse.data.change}
                locale={locale}
                upLabel={dict.marketUp}
                downLabel={dict.marketDown}
              />
            </div>
          ) : null}
        </LiveWidget>

        <LiveWidget
          title={locale === 'en' ? 'Forex (NRB)' : 'विदेशी मुद्रा (नराे)'}
          titleLang={lang}
          status={forex.status}
          source={sourceFor(forex.source, locale)}
          updatedLabel={relativeTime(forex.updatedAt, locale)}
          mock={showMock && forex.mock}
          labels={labels}
          className="col-span-2 sm:col-span-1"
        >
          {forex.data && forex.data.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-meta">
              {forex.data.slice(0, 4).map((r) => (
                <li key={r.iso3} className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink-soft" lang="en">
                    {r.iso3}
                  </span>
                  <span className="tabular-nums text-ink">
                    {localizeNumber(r.sell.toFixed(2), locale)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </LiveWidget>
      </div>
    </section>
  )
}

function NepseDelta({
  value,
  points,
  locale,
  upLabel,
  downLabel,
}: {
  value: number
  points: number
  locale: Locale
  upLabel: string
  downLabel: string
}) {
  const up = value >= 0
  const pct = localizeNumber(Math.abs(value).toFixed(2), locale)
  const pts = localizeNumber(Math.abs(points).toFixed(2), locale)
  return (
    <span className={up ? 'text-meta font-semibold text-up' : 'text-meta font-semibold text-down'}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {pts} ({pct}%)
      <span className="sr-only" lang={locale === 'en' ? 'en' : 'ne'}>
        {' '}
        {up ? upLabel : downLabel}
      </span>
    </span>
  )
}

function sourceFor(source: string, locale: Locale): string {
  if (/mock/i.test(source))
    return locale === 'en' ? 'Verified feed pending' : 'प्रमाणित फिड प्रतीक्षामा'
  return source
}
