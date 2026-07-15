export const CONSENT_KEY = 'nw-cookie-consent-v3'
export const LEGACY_CONSENT_KEY = 'nw-cookie-consent-v2'
export const CONSENT_EVENT = 'nw-cookie-consent-change'
export const READER_ID_KEY = 'nw-reader-fp'

const PERSONALIZATION_KEYS = [
  'nagarik-watch:reader-preferences:v2',
  'nagarik-watch:reader-preferences:v1',
  'nw-saved-stories',
  'nw-continue-reading',
  'nw-reading-history',
] as const

export type ConsentChoice = {
  essential: true
  personalization: boolean
  analytics: boolean
  decidedAt: string
}

export type CookieCategory = {
  id: 'essential' | 'personalization' | 'analytics'
  required?: boolean
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  { id: 'essential', required: true },
  { id: 'personalization' },
  { id: 'analytics' },
]

export function defaultConsent(): ConsentChoice {
  return {
    essential: true,
    personalization: false,
    analytics: false,
    decidedAt: new Date(0).toISOString(),
  }
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const current = window.localStorage.getItem(CONSENT_KEY)
    if (current) return normalizeConsent(JSON.parse(current) as Partial<ConsentChoice>)
    const legacy = window.localStorage.getItem(LEGACY_CONSENT_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy) as { analytics?: boolean; decidedAt?: string }
      return normalizeConsent({
        essential: true,
        personalization: false,
        analytics: Boolean(parsed.analytics),
        decidedAt: parsed.decidedAt,
      })
    }
  } catch {
    return null
  }
  return null
}

export function writeConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return
  const previous = readConsent()
  const normalized = normalizeConsent(choice)
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(normalized))
  window.document.cookie = `nw_consent=${encodeURIComponent(
    JSON.stringify({
      personalization: normalized.personalization,
      analytics: normalized.analytics,
    }),
  )}; Path=/; Max-Age=31536000; SameSite=Lax${
    window.location.protocol === 'https:' ? '; Secure' : ''
  }`

  if (previous?.personalization && !normalized.personalization) {
    clearPersonalizationStorage()
  }
  if (previous?.analytics && !normalized.analytics) {
    document.querySelectorAll('script[data-nw-analytics]').forEach((node) => node.remove())
  }

  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function clearPersonalizationStorage(): void {
  if (typeof window === 'undefined') return
  for (const key of PERSONALIZATION_KEYS) {
    window.localStorage.removeItem(key)
  }
  window.document.cookie = 'nw_reader=; Path=/; Max-Age=0; SameSite=Lax'
  window.localStorage.removeItem(READER_ID_KEY)
}

export function hasPersonalizationConsent(): boolean {
  return readConsent()?.personalization === true
}

export function hasAnalyticsConsent(): boolean {
  return readConsent()?.analytics === true
}

export function getOrCreateReaderId(): string {
  if (typeof window === 'undefined') return ''
  if (!hasPersonalizationConsent()) return ''
  let fp = window.localStorage.getItem(READER_ID_KEY)
  if (!fp) {
    const random =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    fp = `anon-${random}`
    window.localStorage.setItem(READER_ID_KEY, fp)
    window.document.cookie = `nw_reader=${encodeURIComponent(fp)}; Path=/; Max-Age=31536000; SameSite=Lax${
      window.location.protocol === 'https:' ? '; Secure' : ''
    }`
  }
  return fp
}

function normalizeConsent(raw: Partial<ConsentChoice>): ConsentChoice {
  return {
    essential: true,
    personalization: Boolean(raw.personalization),
    analytics: Boolean(raw.analytics),
    decidedAt: typeof raw.decidedAt === 'string' ? raw.decidedAt : new Date().toISOString(),
  }
}
