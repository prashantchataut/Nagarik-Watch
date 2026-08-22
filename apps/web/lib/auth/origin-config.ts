export type AuthOriginEnv = Record<string, string | undefined>

export function normalizeAuthOrigin(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  const raw = value.trim()
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}

export function isProductionSafeOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:') return false
    return !(
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.localhost')
    )
  } catch {
    return false
  }
}

export function resolveAuthBaseUrl(
  env: AuthOriginEnv,
  fallbackSiteUrl: string,
): string {
  const production = env.NODE_ENV === 'production'
  const candidates = [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_SITE_URL, env.SITE_URL, fallbackSiteUrl]
  for (const candidate of candidates) {
    const origin = normalizeAuthOrigin(candidate)
    if (!origin) continue
    if (production && !isProductionSafeOrigin(origin)) continue
    return origin
  }
  return production ? 'https://www.nagarikwatch.com' : 'http://localhost:3000'
}
