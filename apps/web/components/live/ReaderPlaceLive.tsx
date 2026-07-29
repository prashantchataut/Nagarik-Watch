'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import type { LivePlace } from '@/lib/live/places'
import {
  hasStoredPlaceChoice,
  readLocalPlace,
} from '@/lib/reader/place'
import { fetchPlaceWeatherInBrowser } from '@/lib/live/fetch-place-weather-browser'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { PlaceCityPicker } from '@/components/live/PlaceCityPicker'
import { DEFAULT_LIVE_PLACE_SLUG, resolveLivePlace } from '@/lib/live/places'

type ReaderPlaceLiveProps = {
  locale: Locale
  variant?: 'strip' | 'board'
}

type WeatherPayload = {
  ok: boolean
  tempC?: number
  aqi?: number
  error?: string
}

async function loadWeather(slug: string): Promise<{ tempC: number; aqi?: number } | null> {
  if (hasLivePublicApi()) {
    try {
      const res = await fetch(`/api/live/weather?slug=${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      })
      const json = (await res.json()) as WeatherPayload
      if (json.ok && typeof json.tempC === 'number') {
        return { tempC: json.tempC, aqi: json.aqi }
      }
    } catch {
      /* fall through to browser fetch */
    }
  }

  try {
    return await fetchPlaceWeatherInBrowser(slug)
  } catch {
    return null
  }
}

export function ReaderPlaceLive({ locale, variant = 'board' }: ReaderPlaceLiveProps) {
  const en = locale === 'en'
  // SSR + first client paint must match: default capital until mount reads storage.
  const [place, setPlace] = useState<LivePlace>(() => resolveLivePlace(DEFAULT_LIVE_PLACE_SLUG))
  const [chosen, setChosen] = useState(false)
  const [tempC, setTempC] = useState<number | null>(null)
  const [aqi, setAqi] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshWeather = useCallback(async (slug: string) => {
    setLoading(true)
    setError(null)
    try {
      const reading = await loadWeather(slug)
      if (!reading) {
        setError(en ? 'Weather unavailable' : 'मौसम उपलब्ध छैन')
        setTempC(null)
        setAqi(null)
        return
      }
      setTempC(reading.tempC)
      setAqi(typeof reading.aqi === 'number' ? reading.aqi : null)
    } catch {
      setError(en ? 'Weather unavailable' : 'मौसम उपलब्ध छैन')
      setTempC(null)
      setAqi(null)
    } finally {
      setLoading(false)
    }
  }, [en])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // Never auto-call geolocation: Permissions-Policy blocks it, and silent
      // prompts are hostile on a public news site. City detect is opt-in via picker.
      const local = readLocalPlace()
      if (cancelled) return
      setPlace(local)
      setChosen(hasStoredPlaceChoice())
      await refreshWeather(local.slug)
    })()
    return () => {
      cancelled = true
    }
  }, [refreshWeather])

  const onPlaceChange = (next: LivePlace, explicit: boolean) => {
    setPlace(next)
    setChosen(explicit)
    void refreshWeather(next.slug)
  }

  const placeLabel = en ? place.placeEn : place.placeNe
  const showReference = !chosen && variant === 'board'

  if (variant === 'strip') {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1.5 text-caption text-ink">
          {loading ? (
            <span className="text-ink-soft">{en ? 'Weather…' : 'मौसम…'}</span>
          ) : error ? (
            <span className="text-ink-soft">{error}</span>
          ) : (
            <>
              <span className="font-bold tabular-nums text-ink">{tempC}°C</span>
              <span className="text-ink-soft">{placeLabel}</span>
              {typeof aqi === 'number' ? (
                <span className="text-ink-soft">
                  {en ? 'AQI' : 'वायु'} {aqi}
                </span>
              ) : null}
            </>
          )}
        </span>
        <PlaceCityPicker
          locale={locale}
          place={place}
          onPlaceChange={onPlaceChange}
          compact
        />
      </div>
    )
  }

  return (
    <section className="border border-rule bg-surface-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-bold text-brand-strong">
            {en ? 'Local weather' : 'स्थानीय मौसम'}
          </p>
          {loading ? (
            <p className="mt-2 text-body-sm text-ink-soft">
              {en ? 'Loading weather…' : 'मौसम लोड हुँदै…'}
            </p>
          ) : error ? (
            <p className="mt-2 text-body-sm text-ink-soft">{error}</p>
          ) : (
            <p className="mt-2 font-display text-display-sm font-extrabold tabular-nums text-ink">
              {tempC}°C
              <span className="ml-2 text-body-lg font-bold text-ink-soft">{placeLabel}</span>
            </p>
          )}
          {typeof aqi === 'number' ? (
            <p className="mt-1 text-caption text-ink-soft">
              {en ? `Air quality index ${aqi}` : `वायु गुणस्तर सूचक ${aqi}`}
            </p>
          ) : null}
          {showReference ? (
            <p className="mt-2 text-caption text-ink-soft">
              {en
                ? 'Capital reference. Pick your city for local weather.'
                : 'राजधानी सन्दर्भ। स्थानीय मौसमका लागि सहर छान्नुहोस्।'}
            </p>
          ) : null}
        </div>
        <PlaceCityPicker locale={locale} place={place} onPlaceChange={onPlaceChange} />
      </div>
    </section>
  )
}
