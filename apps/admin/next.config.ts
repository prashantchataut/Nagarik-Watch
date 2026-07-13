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
 * Security headers, CSP, and image config are tightened in Phase 5
 * (architecture.md §6); for now the config is minimal so the admin boots
 * against the verified foundation.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@payloadcms/ui'],
  },
}

export default withPayload(nextConfig)
