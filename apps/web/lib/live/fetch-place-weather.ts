import 'server-only'

import { resolveLivePlace, type LivePlace } from '@/lib/live/places'

export type PlaceWeatherReading = {
  tempC: number
  aqi?: number
  place: LivePlace
  source: string
}

/**
 * Keyless Open-Meteo weather + AQI for a Nepal desk city.
 * No API key required; optional WEATHER_PROVIDER keys apply only to server Kathmandu widgets in real.ts.
 */
export async function fetchPlaceWeather(slug: string): Promise<PlaceWeatherReading> {
  const place = resolveLivePlace(slug)
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m&timezone=auto`
  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=us_aqi`

  const weatherRes = await fetch(weatherUrl, { next: { revalidate: 300 } })
  if (!weatherRes.ok) throw new Error(`weather http ${weatherRes.status}`)

  const weatherJson = (await weatherRes.json()) as {
    current?: { temperature_2m?: number }
  }
  const tempC = weatherJson.current?.temperature_2m
  if (typeof tempC !== 'number') throw new Error('weather shape')

  let aqi: number | undefined
  try {
    const aqiRes = await fetch(aqiUrl, { next: { revalidate: 300 } })
    if (aqiRes.ok) {
      const aqiJson = (await aqiRes.json()) as { current?: { us_aqi?: number } }
      if (typeof aqiJson.current?.us_aqi === 'number') {
        aqi = Math.round(aqiJson.current.us_aqi)
      }
    }
  } catch {
    /* AQI is optional */
  }

  return {
    tempC: Math.round(tempC),
    aqi,
    place,
    source: 'Open-Meteo',
  }
}
