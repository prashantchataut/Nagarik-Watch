import type { NextConfig } from 'next'

/**
 * apps/admin Next.js config — Payload CMS host.
 * Security headers, CSP, and image config are tightened in Phase 5 (architecture.md §6);
 * for now the config is minimal so the admin boots against the verified foundation.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Payload compiles its admin bundle server-side; exclude it from transpilation overrides.
  experimental: {
    optimizePackageImports: ['@payloadcms/ui'],
  },
}

export default nextConfig
