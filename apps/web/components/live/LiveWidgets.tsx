import type { Locale } from '@nagarikwatch/db'
import { LiveWidget } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'
import {
  getRealAqi,
  getRealForex,
  getRealGoldSilver,
  getRealNepse,
  getRealWeather,
} from '@/lib/live/real'
import { aqiBand, localizeNumber, relativeTime } from '@/lib/live/format'

export async function UtilityWidgetRail({ locale }: { locale: Locale }) {
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
  const showFallbackBadge = true

  const [weather, aqi, nepse, metals, forex] = await Promise.all([
    getRealWeather(locale),
    getRealAqi(locale),
    getRealNepse(locale),
    getRealGoldSilver(locale),
    getRealForex(locale),
  ])

  return (
    <aside
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      aria-label={locale === 'en' ? 'Daily utility data' : 'दैनिक उपयोगी डाटा'}
    >
      <LiveWidget
        title={dict.weatherTitle}
        titleLang={lang}
        status={weather.status}
        source={sourceFor(weather.source, locale)}
        updatedLabel={relativeTime(weather.updatedAt, locale)}
        mock={showFallbackBadge && weather.mock}
        labels={labels}
      >
        {weather.data ? (
          <p className="text-body text-ink">
            <span className="font-display text-h2 font-bold">
              {localizeNumber(weather.data.tempC, locale)}°C
            </span>{' '}
            <span className="text-ink-soft" lang={lang}>
              {locale === 'en' ? weather.data.placeEn : weather.data.placeNe}
            </span>
          </p>
        ) : null}
      </LiveWidget>

      <LiveWidget
        title={dict.aqiTitle}
        titleLang={lang}
        status={aqi.status}
        source={sourceFor(aqi.source, locale)}
        updatedLabel={relativeTime(aqi.updatedAt, locale)}
        mock={showFallbackBadge && aqi.mock}
        labels={labels}
      >
        {aqi.data ? <AqiValue aqi={aqi.data.aqi} locale={locale} /> : null}
      </LiveWidget>

      <LiveWidget
        title={dict.nepseTitle}
        titleLang="en"
        status={nepse.status}
        source={sourceFor(nepse.source, locale)}
        updatedLabel={relativeTime(nepse.updatedAt, locale)}
        mock={showFallbackBadge && nepse.mock}
        labels={labels}
        tone={nepse.data && nepse.data.change >= 0 ? 'up' : 'down'}
      >
        {nepse.data ? (
          <div className="flex items-baseline gap-2">
            <span className="font-display text-h2 font-bold text-ink">
              {localizeNumber(nepse.data.index.toFixed(2), locale)}
            </span>
            <span
              className={
                nepse.data.change >= 0
                  ? 'text-meta font-semibold text-up'
                  : 'text-meta font-semibold text-down'
              }
            >
              <span aria-hidden="true">{nepse.data.change >= 0 ? '▲' : '▼'}</span>{' '}
              {localizeNumber(Math.abs(nepse.data.changePercent).toFixed(2), locale)}%
            </span>
          </div>
        ) : null}
      </LiveWidget>

      <LiveWidget
        title={locale === 'en' ? 'Forex' : 'विदेशी मुद्रा'}
        titleLang={lang}
        status={forex.data && forex.data.length > 0 ? forex.status : 'empty'}
        source={sourceFor(forex.source, locale)}
        updatedLabel={relativeTime(forex.updatedAt, locale)}
        mock={showFallbackBadge && forex.mock}
        labels={labels}
      >
        {forex.data && forex.data.length > 0 ? (
          <ul className="grid gap-1 text-meta text-ink-soft">
            {forex.data.slice(0, 4).map((rate) => (
              <li key={rate.iso3} className="flex justify-between gap-3">
                <span className="font-semibold" lang="en">
                  {rate.iso3}
                </span>
                <span className="tabular-nums text-ink">
                  {localizeNumber(rate.sell.toFixed(2), locale)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </LiveWidget>

      <LiveWidget
        title={locale === 'en' ? 'Gold' : 'सुन'}
        titleLang={lang}
        status={metals.status}
        source={sourceFor(metals.source, locale)}
        updatedLabel={relativeTime(metals.updatedAt, locale)}
        mock={showFallbackBadge && metals.mock}
        labels={labels}
      >
        {metals.data ? (
          <p className="text-body text-ink">
            <span className="font-display text-h2 font-bold">
              रु. {localizeNumber(metals.data.goldTolaNpr.toLocaleString('en-IN'), locale)}
            </span>{' '}
            <span className="text-meta text-mute" lang={lang}>
              {locale === 'en' ? 'per tola' : 'प्रति तोला'}
            </span>
          </p>
        ) : null}
      </LiveWidget>

      <LiveWidget
        title={locale === 'en' ? 'Silver' : 'चाँदी'}
        titleLang={lang}
        status={metals.status}
        source={sourceFor(metals.source, locale)}
        updatedLabel={relativeTime(metals.updatedAt, locale)}
        mock={showFallbackBadge && metals.mock}
        labels={labels}
      >
        {metals.data ? (
          <p className="text-body text-ink">
            <span className="font-display text-h2 font-bold">
              रु. {localizeNumber(metals.data.silverTolaNpr.toLocaleString('en-IN'), locale)}
            </span>{' '}
            <span className="text-meta text-mute" lang={lang}>
              {locale === 'en' ? 'per tola' : 'प्रति तोला'}
            </span>
          </p>
        ) : null}
      </LiveWidget>
    </aside>
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
    <p className="text-body text-ink">
      <span className={`font-display text-h2 font-bold ${color}`}>
        {localizeNumber(aqi, locale)}
      </span>{' '}
      <span className="text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
        {label}
      </span>
    </p>
  )
}

function sourceFor(source: string, locale: Locale): string {
  if (/mock/i.test(source))
    return locale === 'en' ? 'Verified feed pending' : 'प्रमाणित फिड प्रतीक्षामा'
  return source
}
