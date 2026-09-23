import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

/**
 * apps/admin Next.js config — Payload CMS host.
 *
 * `withPayload` wraps the config so the catch-all REST route
 * (`src/app/(payload)/api/[...slug]/route.ts`) and the admin pages are treated
 * correctly at build time. Without it, `next build` tries to statically
 * "collect page data" for the Payload route — which imports payload.config.ts
 * and boots the DB adapter — and fails in the Vercel build sandbox where the DB
 * isn't reachable. withPayload marks those routes dynamic and applies the right
 * output/webpack settings.
 *
 * The route directory MUST stay a catch-all (`[...slug]`): `@payloadcms/next`'s
 * `REST_GET`/`REST_POST` handlers are typed against
 * `params: Promise<{ slug?: string[] }>`. A single-segment `[payload]` folder
 * makes `next build` fail its route-type check (verified 2026-09-23).
 *
 * Keep this host narrowly scoped to the Payload admin/API surface. Reader-site
 * security headers and public image policy live in apps/web.
 */

/**
 * Staff-only host hardening.
 *
 * This is the most privileged surface on the platform (newsroom credentials,
 * draft journalism, uploads), so it gets stricter headers than the reader site:
 *
 * - `noindex`/`noarchive` on every response: the CMS must never be indexed.
 * - `Referrer-Policy: no-referrer`: never leak CMS URLs (which contain document
 *   ids and collection names) to any third party.
 * - `frame-ancestors 'none'` + `X-Frame-Options: DENY`: clickjacking a logged-in
 *   editor is a real privilege-escalation path, so framing is refused outright.
 *
 * The CSP deliberately lists only `frame-ancestors`, `base-uri`, `object-src`
 * and `form-action`. Payload's admin UI requires inline scripts/styles and
 * eval-based tooling (Lexical/Monaco), so a `default-src` here would blank the
 * CMS. An incomplete CSP is still enforced for the directives it does name,
 * which is where the meaningful risk sits for a staff console.
 */
const staffSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework on the privileged host.
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['@payloadcms/ui'],
  },
  async headers() {
    return [{ source: '/:path*', headers: staffSecurityHeaders }]
  },
}

export default withPayload(nextConfig)
