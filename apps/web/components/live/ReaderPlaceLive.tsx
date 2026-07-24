'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { LIVE_PLACE_EVENT, LIVE_PLACES, type LivePlace } from '@/lib/live/places'
import {
  detectPlaceFromGeolocation,
  readLocalPlace,
  writeLocalPlace,
} from '@/lib/reader/place'
import { localizeNumber } from '@/lib/live/format'

type WeatherState = {
  tempC: number
  place: LivePlace
  source: string
  status: 'loading' | 'ok' | 'error'
}

type AqiState = {
  aqi: number
  status: 'loading' | 'ok' | 'error'
}

async function fetchOpenMeteo(place: LivePlace): Promise<{ tempC: number; aqi?: number }> {
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m&timezone=auto`
  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=us_aqi`
  const [weatherRes, aqiRes] = await Promise.all([fetch(weatherUrl), fetch(aqiUrl)])
  if (!weatherRes.ok) throw new Error(`weather ${weatherRes.status}`)
  const weatherJson = (await weatherRes.json()) as {
    current?: { temperature_2m?: number }
  }
  const tempC = weatherJson.current?.temperature_2m
  if (typeof tempC !== 'number') throw new Error('weather shape')
  let aqi: number | undefined
  if (aqiRes.ok) {
    const aqiJson = (await aqiRes.json()) as { current?: { us_aqi?: number } }
    if (typeof aqiJson.current?.us_aqi === 'number') aqi = Math.round(aqiJson.current.us_aqi)
  }
  return { tempC: Math.round(tempC), aqi }
}

export function ReaderPlaceLive({
  locale,
  variant = 'strip',
}: {
  locale: Locale
  variant?: 'strip' | 'board'
}) {
  const en = locale === 'en'
  const [place, setPlace] = useState<LivePlace>(() =>
    typeof window === 'undefined' ? LIVE_PLACES[0]! : readLocalPlace(),
  )
  const [chosen, setChosen] = useState(false)
  const [weather, setWeather] = useState<WeatherState>({
    tempC: 0,
    place: LIVE_PLACES[0]!,
    source: 'Open-Meteo',
    status: 'loading',
  })
  const [aqi, setAqi] = useState<AqiState>({ aqi: 0, status: 'loading' })
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    const current = readLocalPlace()
    setPlace(current)
    try {
      setChosen(Boolean(localStorage.getItem('nagarik-watch:place:v1')))
    } catch {
      setChosen(false)
    }
    function onChange() {
      setPlace(readLocalPlace())
      setChosen(true)
    }
    window.addEventListener(LIVE_PLACE_EVENT, onChange)
    return () => window.removeEventListener(LIVE_PLACE_EVENT, onChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    setWeather((prev) => ({ ...prev, status: 'loading', place }))
    setAqi((prev) => ({ ...prev, status: 'loading' }))
    fetchOpenMeteo(place)
      .then((data) => {
        if (cancelled) return
        setWeather({
          tempC: data.tempC,
          place,
          source: 'Open-Meteo',
          status: 'ok',
        })
        if (typeof data.aqi === 'number') setAqi({ aqi: data.aqi, status: 'ok' })
        else setAqi({ aqi: 0, status: 'error' })
      })
      .catch(() => {
        if (cancelled) return
        setWeather((prev) => ({ ...prev, status: 'error', place }))
        setAqi({ aqi: 0, status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [place])

  function onSelect(slug: string) {
    writeLocalPlace(slug)
    setPlace(readLocalPlace())
    setChosen(true)
    setGeoError(null)
  }

  async function useMyLocation() {
    setGeoBusy(true)
    setGeoError(null)
    try {
      const detected = await detectPlaceFromGeolocation()
      writeLocalPlace(detected.slug)
      setPlace(detected)
      setChosen(true)
    } catch {
      setGeoError(en ? 'Location permission denied or unavailable.' : 'स्थान अनुमति मिलेन वा उपलब्ध छैन।')
    } finally {
      setGeoBusy(false)
    }
  }

  const placeLabel = en ? place.placeEn : place.placeNe
  const referenceNote = chosen
    ? null
    : en
      ? 'Capital reference until you choose your city'
      : 'सहर छान्नुअघि राजधानी सन्दर्भ'

  if (variant === 'board') {
    return (
      <div className="col-span-2 space-y-3 sm:col-span-3 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="border border-rule bg-surface-raised px-3 py-3">
            <p className="text-caption font-semibold text-ink-soft" lang={en ? 'en' : 'ne'}>
              {en ? 'Weather' : 'मौसम'}
            </p>
            {weather.status === 'ok' ? (
              <p className="mt-1 font-display text-h2 font-bold text-ink">
                {localizeNumber(weather.tempC, locale)}°C{' '}
                <span className="text-meta font-semibold text-ink-soft" lang={en ? 'en' : 'ne'}>
                  {placeLabel}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-meta text-mute" lang={en ? 'en' : 'ne'}>
                {weather.status === 'loading' ? (en ? 'Loading…' : 'लोड हुँदै…') : en ? 'Unavailable' : 'उपलब्ध छैन'}
              </p>
            )}
          </div>
          <div className="border border-rule bg-surface-raised px-3 py-3">
            <p className="text-caption font-semibold text-ink-soft">AQI</p>
            {aqi.status === 'ok' ? (
              <p className="mt-1 font-display text-h2 font-bold text-ink">
                {localizeNumber(aqi.aqi, locale)}
              </p>
            ) : (
              <p className="mt-1 text-meta text-mute" lang={en ? 'en' : 'ne'}>
                {aqi.status === 'loading' ? (en ? 'Loading…' : 'लोड हुँदै…') : en ? 'Unavailable' : 'उपलब्ध छैन'}
              </p>
            )}
          </div>
        </div>
        <PlaceControls
          locale={locale}
          place={place}
          chosen={chosen}
          referenceNote={referenceNote}
          geoBusy={geoBusy}
          geoError={geoError}
          onSelect={onSelect}
          onDetect={useMyLocation}
        />
      </div>
    )
  }

  return (
    <div className="inline-flex shrink-0 items-center gap-3">
      <span className="inline-flex items-center gap-2">
        <span className="font-semibold text-ink" lang={en ? 'en' : 'ne'}>
          {weather.status === 'ok'
            ? `${localizeNumber(weather.tempC, locale)}°C ${placeLabel}`
            : placeLabel}
        </span>
        {aqi.status === 'ok' ? (
          <span className="text-mute">AQI {localizeNumber(aqi.aqi, locale)}</span>
        ) : null}
      </span>
      <PlaceControls
        locale={locale}
        place={place}
        chosen={chosen}
        referenceNote={referenceNote}
        geoBusy={geoBusy}
        geoError={geoError}
        onSelect={onSelect}
        onDetect={useMyLocation}
        compact
      />
    </div>
  )
}

function PlaceControls({
  locale,
  place,
  chosen,
  referenceNote,
  geoBusy,
  geoError,
  onSelect,
  onDetect,
  compact = false,
}: {
  locale: Locale
  place: LivePlace
  chosen: boolean
  referenceNote: string | null
  geoBusy: boolean
  geoError: string | null
  onSelect: (slug: string) => void
  onDetect: () => void
  compact?: boolean
}) {
  const en = locale === 'en'
  return (
    <div className={compact ? 'inline-flex items-center gap-2' : 'space-y-2'}>
      <label className={compact ? 'inline-flex items-center gap-1.5' : 'flex flex-wrap items-center gap-2'}>
        <span className="sr-only">{en ? 'Your city for weather and local news' : 'मौसम र स्थानीय समाचारका लागि सहर'}</span>
        <select
          value={place.slug}
          onChange={(event) => onSelect(event.currentTarget.value)}
          className="min-h-9 border border-rule bg-surface px-2 text-caption font-semibold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={en ? 'en' : 'ne'}
          aria-label={en ? 'Choose your city' : 'सहर छान्नुहोस्'}
        >
          {LIVE_PLACES.map((item) => (
            <option key={item.slug} value={item.slug}>
              {en ? item.placeEn : item.placeNe}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onDetect}
          disabled={geoBusy}
          className="min-h-9 border border-rule px-2 text-caption font-semibold text-brand-strong hover:border-brand disabled:opacity-60"
          lang={en ? 'en' : 'ne'}
        >
          {geoBusy ? (en ? 'Detecting…' : 'पत्ता लगाउँदै…') : en ? 'Use my location' : 'मेरो स्थान'}
        </button>
      </label>
      {referenceNote && !chosen ? (
        <p className="text-caption text-mute" lang={en ? 'en' : 'ne'}>
          {referenceNote}
        </p>
      ) : null}
      {geoError ? (
        <p className="text-caption text-brand-strong" lang={en ? 'en' : 'ne'} role="status">
          {geoError}
        </p>
      ) : null}
    </div>
  )
}
