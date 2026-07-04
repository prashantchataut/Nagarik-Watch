import type { Locale } from '@nagarikwatch/db'
import { LiveWidget } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getRealWeather, getRealAqi, getRealNepse, getRealForex } from '@/lib/live/real'
import { aqiBand, localizeNumber, relativeTime } from '@/lib/live/format'

/**
 * HomeLiveBoard — the homepage "live data" row: weather, air quality, NEPSE index, and
 * NRB forex as full LiveWidget cards (spec Phase 4 §10-12, Phase 6). It is the card-shell
 * counterpart to the slim desktop UtilityStrip, surfaced on the homepage so mobile readers
 * (who never see the desktop strip) still get the glance values.
 *
 * Async server component: every card reads its REAL upstream (Open-Meteo, nepalstock.com,
 * Nepal Rastra Bank) and the shared LiveWidget shell renders source + freshness + MOCK badge
 * honestly. A failed upstream degrades to a MOCK value rather than blocking the homepage.
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

  const weather = await getRealWeather(locale)
  const aqi = await getRealAqi(locale)
  const nepse = await getRealNepse(locale)
  const forex = await getRealForex(locale)

  // Mock badge is dev-only — production readers never see "नमुना".
  const showMock = process.env.NEXT_PUBLIC_SHOW_MOCK_BADGE === 'true'

  return (
    <section className={className} aria-label={lang === 'ne' ? 'लाइभ जानकारी' : 'Live information'}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* Weather */}
        <LiveWidget
          title={dict.weatherTitle}
          titleLang={lang}
          status={weather.status}
          source={weather.source}
          updatedLabel={relativeTime(weather.updatedAt, locale)}
          mock={showMock && weather.mock}
          labels={labels}
        >
          {weather.data ? (
            <p>
              <span className="font-display text-h2 font-bold text-ink">
                {localizeNumber(weather.data.tempC, locale)}°C
              </span>{' '}
              <span className="text-meta text-ink-soft" lang={lang}>
                {locale === 'en' ? weather.data.placeEn : weather.data.placeNe}
              </span>
            </p>
          ) : null}
        </LiveWidget>

        {/* AQI */}
        <LiveWidget
          title={dict.aqiTitle}
          titleLang={lang}
          status={aqi.status}
          source={aqi.source}
          updatedLabel={relativeTime(aqi.updatedAt, locale)}
          mock={showMock && aqi.mock}
          labels={labels}
        >
          {aqi.data ? <AqiValue aqi={aqi.data.aqi} locale={locale} /> : null}
        </LiveWidget>

        {/* NEPSE */}
        <LiveWidget
          title={dict.nepseTitle}
          titleLang="en"
          status={nepse.status}
          source={nepse.source}
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

        {/* Forex (NRB daily rates) */}
        <LiveWidget
          title={locale === 'en' ? 'Forex (NRB)' : 'विदेशी मुद्रा (नराे)'}
          titleLang={lang}
          status={forex.status}
          source={forex.source}
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

function AqiValue({ aqi, locale }: { aqi: number; locale: Locale }) {
  const { band, label } = aqiBand(aqi, locale)
  const color =
    band === 'good'
      ? 'text-aqi-good'
      : band === 'moderate'
        ? 'text-aqi-moderate'
        : band === 'severe'
          ? 'text-aqi-severe'
          : 'text-aqi-unhealthy'
  return (
    <p>
      <span className={`font-display text-h2 font-bold ${color}`}>
        {localizeNumber(aqi, locale)}
      </span>{' '}
      <span className="text-meta text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
        {label}
      </span>
    </p>
  )
}
