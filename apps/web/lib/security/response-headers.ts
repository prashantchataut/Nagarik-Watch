/**
 * Baseline response security headers — the single source of truth.
 *
 * This module is imported by `next.config.ts` (which actually serves the
 * headers) and by `lib/launch-readiness.ts` (which reports on them), so the
 * launch gate can never again report a policy the edge does not send. The
 * previous `baseline-headers.json` was only ever read by the launch gate: the
 * check reported "4/4 baseline security headers configured" while responses
 * carried no CSP and no HSTS at all.
 *
 * It must stay dependency-free and runnable from `next.config.ts`, which is
 * evaluated outside the Next.js module graph — no `server-only`, no `@/`
 * aliases, no Node built-ins.
 *
 * The Content-Security-Policy is assembled from the integrations that are
 * actually configured for the deployment. A static policy would either break
 * AdSense/GAM/Plausible when they are switched on, or permanently allow ad-tech
 * origins on a deployment that serves only house ads.
 */

export type SecurityHeader = { key: string; value: string }

type HeaderEnv = Record<string, string | undefined>

/** Cloudflare Turnstile — the captcha used by contact, tips and poll votes. */
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com'

/** Google Publisher Tag / AdSense need these origins for script, frame and pixel. */
const GOOGLE_AD_SCRIPT_ORIGINS = [
  'https://pagead2.googlesyndication.com',
  'https://securepubads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://www.googletagservices.com',
  'https://adservice.google.com',
] as const

const GOOGLE_AD_FRAME_ORIGINS = [
  'https://googleads.g.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://www.google.com',
] as const

function originOf(value: string | undefined): string | null {
  const raw = value?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin
  } catch {
    return null
  }
}

function uniqueSources(...values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

/** True when the deployment serves a third-party ad network rather than house ads. */
/**
 * Mirrors `isNetworkAdsReady()` in `lib/ads.ts`: ad-tech origins enter the CSP
 * only when the app would actually render a network unit. Keep the two in
 * step — a stricter CSP here silently blanks live inventory, a looser one
 * admits ad-tech origins on a house-ads or ads-off deployment.
 */
function usesAdNetwork(env: HeaderEnv): boolean {
  if (env.NEXT_PUBLIC_ADS_MODE?.trim() !== 'network') return false
  const network = env.NEXT_PUBLIC_AD_NETWORK?.trim().toLowerCase()
  if (network === 'adsense')
    return Boolean(env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() && env.NEXT_PUBLIC_ADSENSE_SLOT?.trim())
  if (network === 'gam')
    return Boolean(
      env.NEXT_PUBLIC_GAM_NETWORK_CODE?.trim() || env.NEXT_PUBLIC_AD_NETWORK_CODE?.trim(),
    )
  return false
}

/**
 * Media hosts the reader may load images from. `next/image` proxies remote
 * images through /_next/image on Vercel, but the OpenNext/Cloudflare target and
 * direct <img> uses in editor previews hit the bucket origin, so the configured
 * storage host has to be explicit rather than relying on a blanket `https:`.
 */
function mediaOrigins(env: HeaderEnv): string[] {
  return uniqueSources(
    originOf(env.STORAGE_PUBLIC_BASE_URL),
    originOf(env.R2_PUBLIC_BASE_URL),
    originOf(env.STORAGE_ENDPOINT),
    originOf(env.R2_ENDPOINT),
  )
}

/**
 * `'unsafe-inline'` in script-src is required, not sloppy: the App Router
 * inlines its flight payload and the theme/no-FOUC bootstrap into the document,
 * and the nonce alternative forces every route to render dynamically, which
 * would give up the SSG/ISR model this news site depends on for LCP.
 *
 * The policy still buys real protection without it — no third-party script
 * origins, no `object-src`, no `base-uri` hijack, no cross-origin `form-action`
 * exfiltration, and `frame-ancestors` clickjacking protection. `lib/launch-
 * readiness` surfaces the residual `unsafe-inline` weakness to the operator via
 * `hasWeakDirectives` rather than hiding it.
 */
export function contentSecurityPolicy(env: HeaderEnv = process.env): string {
  const adNetwork = usesAdNetwork(env)
  const plausible = originOf(env.NEXT_PUBLIC_PLAUSIBLE_SRC) ?? 'https://plausible.io'
  const media = mediaOrigins(env)

  const scriptSrc = uniqueSources(
    "'self'",
    "'unsafe-inline'",
    TURNSTILE_ORIGIN,
    plausible,
    ...(adNetwork ? GOOGLE_AD_SCRIPT_ORIGINS : []),
  )

  const frameSrc = uniqueSources(
    "'self'",
    TURNSTILE_ORIGIN,
    'https://www.youtube-nocookie.com',
    'https://www.youtube.com',
    ...(adNetwork ? GOOGLE_AD_FRAME_ORIGINS : []),
  )

  // Analytics beacons, Sentry ingest and the storage bucket are all https POSTs
  // to hosts that vary per deployment; keeping `https:` here is deliberate and
  // far weaker than the script/frame lists that actually stop code execution.
  const connectSrc = uniqueSources("'self'", 'https:', ...media)

  const imgSrc = uniqueSources("'self'", 'data:', 'blob:', 'https:', ...media)

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'self'"],
    'object-src': ["'none'"],
    'img-src': imgSrc,
    'font-src': ["'self'", 'data:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'script-src': scriptSrc,
    'frame-src': frameSrc,
    'connect-src': connectSrc,
    'media-src': uniqueSources("'self'", 'https:', 'blob:', ...media),
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'form-action': ["'self'"],
  }

  const policy = Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ')

  // Only force https on a real https deployment; on localhost this directive
  // silently breaks every asset request.
  return env.NODE_ENV === 'production' ? `${policy}; upgrade-insecure-requests` : policy
}

/**
 * HSTS is only meaningful (and only safe) on a production https origin. Sending
 * it from a local http dev server pins the browser to https for localhost and
 * makes every other local project on port 3000 unreachable.
 */
function strictTransportSecurity(env: HeaderEnv): SecurityHeader | null {
  if (env.NODE_ENV !== 'production') return null
  return {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  }
}

export function baselineSecurityHeaders(env: HeaderEnv = process.env): SecurityHeader[] {
  const hsts = strictTransportSecurity(env)
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    // Isolates the origin from cross-origin window handles (tabnabbing / XS-Leaks)
    // without the COEP/CORP fallout that `require-corp` would cause for ad iframes.
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ...(hsts ? [hsts] : []),
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(env) },
  ]
}
