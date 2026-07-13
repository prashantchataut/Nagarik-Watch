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

const remotePatterns: RemotePattern[] = [
  { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
  { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
  { protocol: 'https', hostname: 'fastly.picsum.photos', pathname: '/**' },
  ...configuredPatterns,
].filter(
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
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
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
