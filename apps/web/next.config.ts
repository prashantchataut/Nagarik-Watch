import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/**
 * apps/web Next.js config.
 *  - transpilePackages: workspace packages ship TypeScript source.
 *  - images: allow only the editorial media origins configured at build time.
 *  - security headers: baseline protection on every response.
 */
const configDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(configDir, '../..')
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
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
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

const remotePatterns: RemotePattern[] = configuredPatterns.filter(
  (pattern, index, all) =>
    all.findIndex(
      (candidate) =>
        candidate.protocol === pattern.protocol &&
        candidate.hostname === pattern.hostname &&
        candidate.port === pattern.port,
    ) === index,
)

if (process.env.NODE_ENV !== 'production' || process.env.E2E_NEWSROOM === 'true') {
  for (const hostname of ['localhost', '127.0.0.1']) {
    if (!remotePatterns.some((pattern) => pattern.hostname === hostname && pattern.protocol === 'http')) {
      remotePatterns.push({ protocol: 'http', hostname, pathname: '/**' })
    }
  }
}

/** Slim server bundle for Cloudflare Workers Free (3 MiB gzip limit). */
const isCloudflareWorkers = process.env.CF_WORKERS === '1'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nagarikwatch/ui', '@nagarikwatch/db'],
  // Keep Better Auth and PGlite outside Next's webpack graph. Bundling PGlite
  // breaks its import.meta.url WASM paths on Windows/Node 24 (URL realm mismatch).
  serverExternalPackages: [
    'better-auth',
    '@better-auth/core',
    'better-call',
    '@electric-sql/pglite',
    ...(isCloudflareWorkers
      ? ['pg', 'stripe', 'web-push', '@vercel/blob', 'kysely', '@better-auth/kysely-adapter']
      : []),
  ],
  // Monorepo root so NFT does not invent oversized traces from apps/web cwd.
  outputFileTracingRoot: monorepoRoot,
  // Keep serverless functions under Vercel's 250MB uncompressed limit.
  outputFileTracingExcludes: {
    '*': [
      '**/.data/**',
      '**/test-results/**',
      '**/playwright-report/**',
      '**/e2e/**',
      '**/node_modules/@swc/core*/**',
      '**/node_modules/@esbuild/**',
      '**/node_modules/esbuild/**',
      '**/node_modules/webpack/**',
      '**/node_modules/terser/**',
      '**/node_modules/uglify-js/**',
      '**/node_modules/rollup/**',
      '**/node_modules/playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/@playwright/**',
      '**/node_modules/@electric-sql/pglite/**',
      ...(isCloudflareWorkers
        ? [
            '**/node_modules/stripe/**',
            '**/node_modules/web-push/**',
            '**/node_modules/@vercel/blob/**',
            '**/node_modules/pg/**',
            '**/node_modules/pg-*/**',
          ]
        : []),
    ],
    '/api/media/local/[filename]': [
      '**/node_modules/**',
      '**/.data/**',
      '**/data/**',
      '**/e2e/**',
      '**/test-results/**',
      '**/packages/**',
      '**/apps/admin/**',
    ],
  },
  images: isCloudflareWorkers
    ? { unoptimized: true, remotePatterns }
    : {
        formats: ['image/avif', 'image/webp'],
        remotePatterns,
      },
  webpack: (config, { isServer }) => {
    if (isServer && isCloudflareWorkers) {
      const stub = (name: string) => path.join(configDir, 'lib/cf-stubs', name)
      config.resolve ??= {}
      config.resolve.alias = {
        ...(config.resolve.alias as Record<string, string | false>),
        'next/dist/server/og/image-response': false,
        '@electric-sql/pglite': false,
        pg: stub('pg.ts'),
        stripe: stub('stripe.ts'),
        'web-push': stub('web-push.ts'),
        '@vercel/blob': stub('vercel-blob.ts'),
      }
    }
    return config
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

// Enable Cloudflare bindings during `next dev` (OpenNext adapter).
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
initOpenNextCloudflareForDev()
