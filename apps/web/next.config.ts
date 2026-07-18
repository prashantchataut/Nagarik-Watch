import type { NextConfig } from 'next'

/**
 * apps/web Next.js config.
 *  - transpilePackages: workspace packages ship TypeScript source.
 *  - images: allow only the editorial media origins configured at build time.
 *  - security headers: baseline protection on every response.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Baseline CSP — tighten via ADS/analytics allowlists when network ads go live.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
      "frame-src 'self' https://challenges.cloudflare.com",
      "connect-src 'self' https:",
      "media-src 'self' https: blob:",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
]

type RemotePattern = {
  protocol: 'http' | 'https'
  hostname: string
  port?: string
  pathname?: string
}

function configuredRemotePattern(value: string | undefined): RemotePattern | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return {
      protocol: url.protocol.slice(0, -1) as 'http' | 'https',
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: '/**',
    }
  } catch {
    return null
  }
}

const configuredPatterns = [
  process.env.STORAGE_PUBLIC_BASE_URL,
  process.env.PAYLOAD_PUBLIC_SERVER_URL,
  process.env.NEXT_PUBLIC_PAYLOAD_URL,
]
  .map(configuredRemotePattern)
  .filter((pattern): pattern is RemotePattern => pattern !== null)

const staticPatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
  { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
  { protocol: 'https', hostname: 'fastly.picsum.photos', pathname: '/**' },
]

const remotePatterns: RemotePattern[] = [...staticPatterns, ...configuredPatterns].filter(
  (pattern, index, all) =>
    all.findIndex(
      (candidate) =>
        candidate.protocol === pattern.protocol &&
        candidate.hostname === pattern.hostname &&
        candidate.port === pattern.port,
    ) === index,
)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nagarikwatch/ui', '@nagarikwatch/db'],
  // Keep Better Auth outside Next's webpack graph. Its package re-exports
  // (`isAPIError` via `@better-auth/core`) break production bundling.
  serverExternalPackages: ['better-auth', '@better-auth/core', 'better-call'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
  },
  eslint: {
    // Root flat config is validated in CI via `pnpm lint`; do not fail
    // production builds when the lint plugin cannot resolve shared packages.
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
