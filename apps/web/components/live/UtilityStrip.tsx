import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getMockWeather, getMockAqi, getMockNepse } from '@/lib/live/mock'
import { aqiBand, localizeNumber, relativeTime } from '@/lib/live/format'

/**
 * UtilityStrip — the slim "live info" band that sits above the masthead on desktop
 * (DESIGN.md masthead spec / spec Phase 3 "top utility bar"). It surfaces the three glance
 * values a Nepali reader checks reflexively: weather, air quality, and the NEPSE index.
 *
 * It is a SERVER component reading the live source once per render. Today that source is the
 * MOCK module (apps/web/lib/live/mock.ts), so every chip shows a "नमुना / MOCK" badge — no
 * reader is misled. When the live-data agent wires real feeds, only the import swaps; the
 * markup, trust line, and states stay.
 *
 * Hidden below `lg` to keep the mobile chrome short and the first paint focused on the
 * lead story (PRODUCT.md: performance + readability first). The same values can surface in
 * mobile contexts later without changing this component.
 *
 * Inline chips here (not the full LiveWidget card) because the strip is a dense one-line
 * scannable bar; the LiveWidget card shell is used on the homepage / dedicated pages.
 */
export function UtilityStrip({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  const weather = getMockWeather(locale)
  const aqi = getMockAqi(locale)
  const nepse = getMockNepse(locale)

  // A single shared "mock as of" label keeps the strip honest without three timestamps.
  const updated = relativeTime(nepse.updatedAt, locale)
  const anyMock = weather.mock || aqi.mock || nepse.mock

  return (
    <div
      className="hidden border-b border-rule bg-surface-raised lg:block"
      role="complementary"
      aria-label={lang === 'ne' ? 'लाइभ जानकारी' : 'Live information'}
    >
      <div className="mx-auto flex max-w-page items-center gap-4 px-4 py-1.5 text-meta">
        {/* Weather */}
        {weather.status === 'ok' && weather.data ? (
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <WeatherGlyph condition={weather.data.condition} />
            <span lang={lang}>{locale === 'en' ? weather.data.placeEn : weather.data.placeNe}</span>
            <span className="font-semibold text-ink">
              {localizeNumber(weather.data.tempC, locale)}°C
            </span>
          </span>
        ) : null}

        <Divider />

        {/* AQI — band carries colour AND a text label (never colour-only). */}
        {aqi.status === 'ok' && aqi.data ? (
          <AqiChip aqi={aqi.data.aqi} locale={locale} title={dict.aqiTitle} />
        ) : null}

        <Divider />

        {/* NEPSE — up/down state shown with an arrow glyph + colour token. */}
        {nepse.status === 'ok' && nepse.data ? (
          <a
            href={`${locale === 'en' ? '/en' : ''}/search?q=NEPSE`}
            className="inline-flex items-center gap-1.5 rounded-sm text-ink-soft transition-opacity duration-fast ease-out-quint hover:opacity-80"
          >
            <span className="font-semibold uppercase tracking-wide" lang="en">
              {dict.nepseTitle}
            </span>
            <span className="font-semibold text-ink">
              {localizeNumber(nepse.data.index.toFixed(2), locale)}
            </span>
            <NepseDelta value={nepse.data.changePercent} locale={locale} />
          </a>
        ) : null}

        {/* Trust line, pushed to the right: shared timestamp + a single MOCK marker. */}
        <span className="ml-auto inline-flex items-center gap-2 text-caption text-mute">
          {anyMock ? (
            <span
              className="rounded-full bg-brand-tint px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-brand-strong"
              title={
                lang === 'ne'
                  ? 'नमुना डाटा — वास्तविक फिड जोडिएको छैन'
                  : 'Placeholder data — no live feed connected yet'
              }
            >
              {dict.liveMock}
            </span>
          ) : null}
          {updated ? <span lang={lang}>{updated}</span> : null}
        </span>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <span aria-hidden="true" className="h-3 w-px bg-rule" />
  )
}

function NepseDelta({ value, locale }: { value: number; locale: Locale }) {
  const up = value >= 0
  const pct = localizeNumber(Math.abs(value).toFixed(2), locale)
  return (
    <span
      className={up ? 'inline-flex items-center gap-0.5 text-up' : 'inline-flex items-center gap-0.5 text-down'}
    >
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      <span>{pct}%</span>
    </span>
  )
}

function AqiChip({ aqi, locale, title }: { aqi: number; locale: Locale; title: string }) {
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
    <span className="inline-flex items-center gap-1.5 text-ink-soft" title={title}>
      <span className="font-semibold uppercase tracking-wide">AQI</span>
      <span className={`font-semibold ${color}`}>{localizeNumber(aqi, locale)}</span>
      <span className="text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
        {label}
      </span>
    </span>
  )
}

function WeatherGlyph({ condition }: { condition: string }) {
  // Minimal line glyph; full weather iconography is a later pass. aria-hidden (label is text).
  const path =
    condition === 'rain' || condition === 'storm'
      ? 'M16 13a4 4 0 0 0-3.8-4A5 5 0 0 0 3 10a3 3 0 0 0 0 6h12a3 3 0 0 0 1-5.8M8 19l-1 2m4-2-1 2m4-2-1 2'
      : condition === 'clouds' || condition === 'haze'
        ? 'M17 14a4 4 0 0 0-3.8-4A5 5 0 0 0 4 11a3 3 0 0 0 0 6h13a3 3 0 0 0 0-3'
        : 'M12 3v2m0 14v2m9-9h-2M5 12H3m14.5-6.5-1.5 1.5M7 17l-1.5 1.5m13 0L17 17M7 7 5.5 5.5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z'
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  )
}
