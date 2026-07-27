import { resolveLivePlace } from '@/lib/live/places'

export type BrowserPlaceWeather = {
  tempC: number
  aqi?: number
}

/** Client-side Open-Meteo fetch (no API key). Used on static Cloudflare Pages export. */
export async function fetchPlaceWeatherInBrowser(slug: string): Promise<BrowserPlaceWeather> {
  const place = resolveLivePlace(slug)
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m&timezone=auto`
  const aqiUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=us_aqi`

  const weatherRes = await fetch(weatherUrl)
  if (!weatherRes.ok) throw new Error(`weather http ${weatherRes.status}`)

  const weatherJson = (await weatherRes.json()) as {
    current?: { temperature_2m?: number }
  }
  const tempC = weatherJson.current?.temperature_2m
  if (typeof tempC !== 'number') throw new Error('weather shape')

  let aqi: number | undefined
  try {
    const aqiRes = await fetch(aqiUrl)
    if (aqiRes.ok) {
      const aqiJson = (await aqiRes.json()) as { current?: { us_aqi?: number } }
      if (typeof aqiJson.current?.us_aqi === 'number') {
        aqi = Math.round(aqiJson.current.us_aqi)
      }
    }
  } catch {
    /* optional */
  }

  return { tempC: Math.round(tempC), aqi }
}
