import type { NextConfig } from 'next'
import { baselineSecurityHeaders } from './lib/security/response-headers'

function hostFromUrl(value?: string) {
  if (!value) return null
  try {
    const u = new URL(value)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    return {
      protocol: u.protocol.slice(0, -1) as 'https' | 'http',
      hostname: u.hostname,
      pathname: '/**',
    }
  } catch {
    return null
  }
}

const configuredHosts = [
  process.env.STORAGE_PUBLIC_BASE_URL,
  process.env.R2_PUBLIC_BASE_URL,
  process.env.STORAGE_ENDPOINT,
  process.env.R2_ENDPOINT,
]
  .map(hostFromUrl)
  .filter((v): v is NonNullable<typeof v> => v !== null)

// Dedupe by hostname+protocol
const remotePatterns = (() => {
  const base = [
    // Keep R2 public bucket hosts for backwards compat
    { protocol: 'https' as const, hostname: '**.r2.dev', pathname: '/**' },
    { protocol: 'https' as const, hostname: 'r2.dev', pathname: '/**' },
    // Void Drive / generic S3 public host will be added via STORAGE_PUBLIC_BASE_URL above
    ...configuredHosts,
  ]
  const seen = new Set<string>()
  return base.filter((p) => {
    const k = `${p.protocol}://${p.hostname}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
})()

/**
 * Static Cloudflare Pages export — PREVIEW ONLY (ADR-004).
 *
 * `apps/web/scripts/build-pages-static.mjs` sets `CF_PAGES_STATIC=1`, stashes
 * `app/api` + `app/admin` and rewrites `force-dynamic` to `force-static` before
 * running `next build`, because a static export has no server to answer an API
 * route or a dynamic render. Without the flag below `next build` emits `.next/`
 * (a server build) and never writes `out/`, which is what the root
 * `wrangler.jsonc` publishes — the deploy then fails with
 * "assets.directory ... does not exist" while the build itself reported success.
 */
const isStaticExport =
  process.env.CF_PAGES_STATIC === '1' || process.env.NEXT_PUBLIC_STATIC_EXPORT === '1'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // `X-Powered-By: Next.js` tells an attacker the framework and narrows the
  // exploit search for free. Nothing reads it, so drop it.
  poweredByHeader: false,
  // Vercel-friendly defaults; SSG + ISR (revalidate) power the newsroom.
  images: {
    remotePatterns,
    // The default optimizer is a server feature; a static export has no server,
    // so `next build` refuses to export until it is turned off.
    ...(isStaticExport ? { unoptimized: true } : {}),
  },
  // No `eslint` key: Next 16 removed the option and `next build` no longer lints.
  // Linting runs through the ESLint CLI (`pnpm lint`) instead.
  //
  // `typescript.ignoreBuildErrors` is deliberately NOT set. It was masking 42
  // real type errors, including two API routes whose response bodies were typed
  // `never`. Keep the build honest: if `pnpm typecheck` fails, the build fails.
  ...(isStaticExport ? { output: 'export' as const } : {}),
  async headers() {
    // Header rules are a server feature too: with `output: 'export'` Next
    // cannot emit them. The Pages build writes `_headers`/`_redirects` into the
    // export instead (see scripts/build-pages-static.mjs), and the CDN applies
    // the equivalent policy.
    if (isStaticExport) return []
    return [
      {
        source: '/:path*',
        headers: baselineSecurityHeaders(process.env),
      },
    ]
  },
}

export default nextConfig
