import type { NextConfig } from 'next'

/**
 * apps/web Next.js config.
 *  - transpilePackages: the workspace UI + DB packages ship TypeScript source, so Next must
 *    transpile them (they are not pre-built).
 *  - images: hero/article imagery in the seed uses Unsplash + Picsum placeholders; all are
 *    remote. Swappable for R2 later (ADR-003).
 *  - Security headers baseline (architecture.md §6), applied to every response.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nagarikwatch/ui', '@nagarikwatch/db'],
  // `@payload-config` is a tsconfig path alias that only resolves inside apps/admin.
  // apps/web pulls it in transitively through the Payload content source, but only
  // executes that code path at runtime when PAYLOAD_CONTENT_SOURCE=payload (decided in
  // lib/content/index.ts). In the default seed-backed build it is dead code, so mark it
  // external on the server: webpack must never resolve or bundle it. Payload resolves the
  // alias at runtime once the admin app is deployed alongside.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals ?? []
      if (Array.isArray(config.externals)) {
        config.externals.push({ '@payload-config': 'commonjs @payload-config' })
      }
    }
    return config
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
    ],
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
