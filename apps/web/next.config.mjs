import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const configDir = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.join(configDir, '../..')
const securityHeaders = JSON.parse(
  fs.readFileSync(path.join(configDir, 'lib/security/baseline-headers.json'), 'utf8'),
)

function configuredRemotePattern(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return {
      protocol: url.protocol.slice(0, -1),
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
  .filter((pattern) => pattern !== null)

// Compatibility for legacy editor rows that stored Brave's image proxy URL
// before durable newsroom media was wired. This fixes the current `_next/image`
// 400s without opening the optimizer to arbitrary remote hosts. New editorial
// media must be uploaded to Payload/Blob; migrate these URLs and remove this
// compatibility host once the legacy corpus is clean.
configuredPatterns.push({
  protocol: 'https',
  hostname: 'imgs.search.brave.com',
  pathname: '/**',
})

// Canonical Payload media is stored in Vercel Blob in production. Blob store
// hostnames are generated per store, so allow only Vercel's public Blob domain
// family rather than permitting arbitrary HTTPS image origins.
configuredPatterns.push({
  protocol: 'https',
  hostname: '**.public.blob.vercel-storage.com',
  pathname: '/**',
})

const remotePatterns = configuredPatterns.filter(
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
    if (
      !remotePatterns.some(
        (pattern) => pattern.hostname === hostname && pattern.protocol === 'http',
      )
    ) {
      remotePatterns.push({ protocol: 'http', hostname, pathname: '/**' })
    }
  }
}

/** Slim server bundle for Cloudflare Workers Free (3 MiB gzip limit). */
const isCloudflareWorkers = process.env.CF_WORKERS === '1'
/** Static HTML export for Cloudflare Pages Free (no Worker script size limit). */
const isStaticPagesExport = process.env.CF_PAGES_STATIC === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticPagesExport ? { output: 'export', trailingSlash: true } : {}),
  reactStrictMode: true,
  transpilePackages: ['@nagarikwatch/ui', '@nagarikwatch/db'],
  serverExternalPackages: [
    'better-auth',
    '@better-auth/core',
    'better-call',
    '@electric-sql/pglite',
    ...(isCloudflareWorkers
      ? ['pg', 'stripe', 'web-push', '@vercel/blob', 'kysely', '@better-auth/kysely-adapter']
      : []),
  ],
  outputFileTracingRoot: monorepoRoot,
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
            '**/node_modules/sass/**',
            '**/node_modules/sass-embedded/**',
            '**/node_modules/@playwright/**',
            '**/node_modules/playwright/**',
            '**/node_modules/playwright-core/**',
            '**/node_modules/next/dist/compiled/next-devtools/**',
            '**/node_modules/next/dist/server/capsize-font-metrics.json',
            '**/node_modules/react-dom/**/react-dom-server*.development.js',
            '**/node_modules/react-dom/**/react-dom.development.js',
            '**/node_modules/react/**/react.development.js',
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
  images:
    isStaticPagesExport || isCloudflareWorkers
      ? { unoptimized: true, remotePatterns }
      : {
          formats: ['image/avif', 'image/webp'],
          remotePatterns,
        },
  webpack: (config, { isServer }) => {
    if (isServer && isCloudflareWorkers) {
      const stub = (name) => path.join(configDir, 'lib/cf-stubs', name)
      config.resolve ??= {}
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        'next/dist/server/og/image-response': false,
        '@electric-sql/pglite': false,
        pg: stub('pg.ts'),
        stripe: stub('stripe.ts'),
        'web-push': stub('web-push.ts'),
        '@vercel/blob': stub('vercel-blob.ts'),
        sass: false,
        'sass-embedded': false,
        '@/lib/algorithms/catalog': stub('algorithms-catalog.ts'),
        [path.join(configDir, 'lib/algorithms/catalog')]: stub('algorithms-catalog.ts'),
        [path.join(configDir, 'lib/algorithms/catalog.ts')]: stub('algorithms-catalog.ts'),
      }
    }
    return config
  },
  eslint: {
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
  async rewrites() {
    return [
      // Edition heroes were compressed PNG → JPEG; stale Postgres/HTML may still request .png.
      {
        source: '/media/edition-2026-07/:slug.png',
        destination: '/media/edition-2026-07/:slug.jpg',
      },
    ]
  },
}

export default nextConfig

if (!isStaticPagesExport) {
  initOpenNextCloudflareForDev()
}
