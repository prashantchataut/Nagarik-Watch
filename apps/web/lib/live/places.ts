/**
 * Nepal place registry for weather/AQI and local-desk personalization.
 * Kathmandu is the default capital reference, never pretended to be "your" city.
 */

export type LivePlace = {
  slug: string
  placeNe: string
  placeEn: string
  provinceSlug: string
  lat: number
  lon: number
}

export const LIVE_PLACE_COOKIE = 'nw_place'
export const LIVE_PLACE_STORAGE_KEY = 'nagarik-watch:place:v1'
export const LIVE_PLACE_EVENT = 'nw-place-change'

/** Default: capital desk reference until the reader chooses a place. */
export const DEFAULT_LIVE_PLACE_SLUG = 'kathmandu'

export const LIVE_PLACES: readonly LivePlace[] = [
  { slug: 'kathmandu', placeNe: 'काठमाडौं', placeEn: 'Kathmandu', provinceSlug: 'bagmati', lat: 27.7172, lon: 85.324 },
  { slug: 'lalitpur', placeNe: 'ललितपुर', placeEn: 'Lalitpur', provinceSlug: 'bagmati', lat: 27.6588, lon: 85.3247 },
  { slug: 'bhaktapur', placeNe: 'भक्तपुर', placeEn: 'Bhaktapur', provinceSlug: 'bagmati', lat: 27.671, lon: 85.4298 },
  { slug: 'pokhara', placeNe: 'पोखरा', placeEn: 'Pokhara', provinceSlug: 'gandaki', lat: 28.2096, lon: 83.9856 },
  { slug: 'bharatpur', placeNe: 'भरतपुर', placeEn: 'Bharatpur', provinceSlug: 'bagmati', lat: 27.6833, lon: 84.4333 },
  { slug: 'biratnagar', placeNe: 'विराटनगर', placeEn: 'Biratnagar', provinceSlug: 'koshi', lat: 26.4525, lon: 87.2718 },
  { slug: 'birgunj', placeNe: 'वीरगञ्ज', placeEn: 'Birgunj', provinceSlug: 'madhesh', lat: 27.0104, lon: 84.877 },
  { slug: 'janakpur', placeNe: 'जनकपुर', placeEn: 'Janakpur', provinceSlug: 'madhesh', lat: 26.7288, lon: 85.926 },
  { slug: 'butwal', placeNe: 'बुटवल', placeEn: 'Butwal', provinceSlug: 'lumbini', lat: 27.7006, lon: 83.4484 },
  { slug: 'nepalgunj', placeNe: 'नेपालगञ्ज', placeEn: 'Nepalgunj', provinceSlug: 'lumbini', lat: 28.05, lon: 81.6167 },
  { slug: 'dhangadhi', placeNe: 'धनगढी', placeEn: 'Dhangadhi', provinceSlug: 'sudurpashchim', lat: 28.6833, lon: 80.6 },
  { slug: 'surkhet', placeNe: 'सुर्खेत', placeEn: 'Surkhet', provinceSlug: 'karnali', lat: 28.6, lon: 81.6167 },
  { slug: 'ilam', placeNe: 'इलाम', placeEn: 'Ilam', provinceSlug: 'koshi', lat: 26.9094, lon: 87.9282 },
] as const

export function resolveLivePlace(slug: string | null | undefined): LivePlace {
  const normalized = String(slug ?? '')
    .trim()
    .toLowerCase()
  return LIVE_PLACES.find((place) => place.slug === normalized) ?? LIVE_PLACES[0]!
}

export function nearestLivePlace(lat: number, lon: number): LivePlace {
  let best = LIVE_PLACES[0]!
  let bestDist = Number.POSITIVE_INFINITY
  for (const place of LIVE_PLACES) {
    const dLat = place.lat - lat
    const dLon = place.lon - lon
    const dist = dLat * dLat + dLon * dLon
    if (dist < bestDist) {
      bestDist = dist
      best = place
    }
  }
  return best
}
