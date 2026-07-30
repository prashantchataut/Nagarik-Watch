export const CONSENT_KEY = 'nw-cookie-consent-v4'
export const LEGACY_CONSENT_KEYS = ['nw-cookie-consent-v3', 'nw-cookie-consent-v2'] as const
export const CONSENT_EVENT = 'nw-cookie-consent-change'
export const CONSENT_OPEN_EVENT = 'nw-cookie-consent-open'
export const READER_ID_KEY = 'nw-reader-fp'
/** Bump when category semantics change — forces a re-prompt once. */
export const CONSENT_POLICY_VERSION = 4

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
  /** First-party ad placement measurement (no third-party ad trackers). */
  advertising: boolean
  decidedAt: string
  version: number
}

export type CookieCategoryId = 'essential' | 'personalization' | 'analytics' | 'advertising'

export type CookieCategory = {
  id: CookieCategoryId
  required?: boolean
}

export const COOKIE_CATEGORIES: CookieCategory[] = [
  { id: 'essential', required: true },
  { id: 'personalization' },
  { id: 'analytics' },
  { id: 'advertising' },
]

export function defaultConsent(): ConsentChoice {
  return {
    essential: true,
    personalization: false,
    analytics: false,
    advertising: false,
    decidedAt: new Date(0).toISOString(),
    version: CONSENT_POLICY_VERSION,
  }
}

export function readConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const current = window.localStorage.getItem(CONSENT_KEY)
    if (current) {
      const parsed = normalizeConsent(JSON.parse(current) as Partial<ConsentChoice>)
      if (parsed.version < CONSENT_POLICY_VERSION) return null
      return parsed
    }
    for (const key of LEGACY_CONSENT_KEYS) {
      const legacy = window.localStorage.getItem(key)
      if (!legacy) continue
      const parsed = JSON.parse(legacy) as Partial<ConsentChoice> & { analytics?: boolean }
      // Force re-prompt once after policy version bump, but prefill analytics from v3.
      if (key === 'nw-cookie-consent-v3') {
        return null
      }
      return normalizeConsent({
        essential: true,
        personalization: false,
        analytics: Boolean(parsed.analytics),
        advertising: false,
        decidedAt: parsed.decidedAt,
      })
    }
  } catch {
    return null
  }
  return null
}

/** Merge a partial update into existing consent without clobbering other flags. */
export function mergeConsent(patch: Partial<Omit<ConsentChoice, 'essential' | 'version'>>): ConsentChoice {
  const previous = readConsent() ?? defaultConsent()
  return writeConsent({
    ...previous,
    ...patch,
    essential: true,
    version: CONSENT_POLICY_VERSION,
    decidedAt: new Date().toISOString(),
  })
}

export function writeConsent(choice: ConsentChoice): ConsentChoice {
  if (typeof window === 'undefined') return normalizeConsent(choice)
  const previous = readConsent()
  const normalized = normalizeConsent(choice)
  window.localStorage.setItem(CONSENT_KEY, JSON.stringify(normalized))
  for (const key of LEGACY_CONSENT_KEYS) {
    window.localStorage.removeItem(key)
  }
  window.document.cookie = `nw_consent=${encodeURIComponent(
    JSON.stringify({
      personalization: normalized.personalization,
      analytics: normalized.analytics,
      advertising: normalized.advertising,
      version: normalized.version,
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
  return normalized
}

export function openCookiePreferences(mode: 'banner' | 'customize' = 'customize'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT, { detail: { mode } }))
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

export function hasAdvertisingConsent(): boolean {
  return readConsent()?.advertising === true
}

/** Analytics or personalization — enough to sync aggregate watch-time / ranking. */
export function hasEngagementConsent(): boolean {
  return hasAnalyticsConsent() || hasPersonalizationConsent()
}

const AGG_READER_KEY = 'nw_agg_reader'

/**
 * Stable id for first-party engagement sync.
 * Personalization: durable localStorage reader id.
 * Analytics-only: session-scoped agg-* id (no cross-session profile).
 */
export function getEngagementSyncId(): string {
  if (typeof window === 'undefined') return ''
  if (hasPersonalizationConsent()) return getOrCreateReaderId()
  if (!hasAnalyticsConsent()) return ''
  try {
    let id = window.sessionStorage.getItem(AGG_READER_KEY)
    if (!id) {
      const random =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      id = `agg-${random}`
      window.sessionStorage.setItem(AGG_READER_KEY, id)
    }
    return id
  } catch {
    return `agg-${Date.now()}`
  }
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

export function normalizeConsent(raw: Partial<ConsentChoice>): ConsentChoice {
  return {
    essential: true,
    personalization: Boolean(raw.personalization),
    analytics: Boolean(raw.analytics),
    advertising: Boolean(raw.advertising),
    decidedAt: typeof raw.decidedAt === 'string' ? raw.decidedAt : new Date().toISOString(),
    version: typeof raw.version === 'number' ? raw.version : CONSENT_POLICY_VERSION,
  }
}
