/**
 * Locale-aware formatting helpers for live widgets.
 *
 * Numbers in the Nepali locale render with Devanagari numerals (PRODUCT.md / DESIGN.md §3:
 * Devanagari is first-class). The AQI band classifier returns a semantic key plus a
 * localized label, and the colour is applied by the widget via tokens, never by hue alone
 * (DESIGN.md §11: no colour-only meaning).
 */
import type { Locale } from '@nagarikwatch/db'

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

/** Render a number's digits in Devanagari for `ne`, leaving separators/sign intact. */
export function localizeNumber(value: number | string, locale: Locale): string {
  const s = String(value)
  if (locale !== 'ne') return s
  return s.replace(/[0-9]/g, (d) => NE_DIGITS[Number(d)] ?? d)
}

/**
 * A compact, locale-aware "x minutes ago" label. Coarse on purpose (the live feeds are not
 * second-accurate); falls back to a date for anything older than a day.
 */
export function relativeTime(iso: string, locale: Locale): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const mins = Math.max(0, Math.round(diffMs / 60000))

  if (mins < 1) return locale === 'ne' ? 'भर्खरै' : 'just now'
  if (mins < 60) {
    const n = localizeNumber(mins, locale)
    return locale === 'ne' ? `${n} मिनेटअघि` : `${mins} min ago`
  }
  const hrs = Math.round(mins / 60)
  if (hrs < 24) {
    const n = localizeNumber(hrs, locale)
    return locale === 'ne' ? `${n} घण्टाअघि` : `${hrs} hr ago`
  }
  const days = Math.round(hrs / 24)
  const n = localizeNumber(days, locale)
  return locale === 'ne' ? `${n} दिनअघि` : `${days} d ago`
}

export type AqiBand = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'severe'

/** Classify a US-AQI integer into a band + a localized, non-alarmist label. */
export function aqiBand(aqi: number, locale: Locale): { band: AqiBand; label: string } {
  if (aqi <= 50) return { band: 'good', label: locale === 'ne' ? 'राम्रो' : 'Good' }
  if (aqi <= 100) return { band: 'moderate', label: locale === 'ne' ? 'मध्यम' : 'Moderate' }
  if (aqi <= 150)
    return {
      band: 'unhealthy-sensitive',
      label: locale === 'ne' ? 'संवेदनशीलका लागि अस्वस्थ' : 'Unhealthy (sensitive)',
    }
  if (aqi <= 200) return { band: 'unhealthy', label: locale === 'ne' ? 'अस्वस्थ' : 'Unhealthy' }
  return { band: 'severe', label: locale === 'ne' ? 'अति अस्वस्थ' : 'Very unhealthy' }
}
