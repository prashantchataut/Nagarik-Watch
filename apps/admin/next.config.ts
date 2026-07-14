import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

/**
 * apps/admin Next.js config — Payload CMS host.
 *
 * `withPayload` wraps the config so the catch-all API route (`/api/[payload]`)
 * and admin pages are treated correctly at build time. Without it, `next build`
 * tries to statically "collect page data" for the Payload route — which imports
 * payload.config.ts and boots the DB adapter — and fails in the Vercel build
 * sandbox where the DB isn't reachable. withPayload marks those routes dynamic
 * and applies the right output/webpack settings.
 *
 * Keep this host narrowly scoped to the Payload admin/API surface. Reader-site
 * security headers and public image policy live in apps/web.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@payloadcms/ui'],
  },
}

export default withPayload(nextConfig)
