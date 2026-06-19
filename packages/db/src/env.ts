/**
 * Typed, validated environment loader. Apps import `env` and the process exits fast
 * with a clear message if a required variable is missing or malformed (SPEC.md §Boundaries).
 *
 * Usage:
 *   import { env } from '@nagarikwatch/db/env'
 *   const dbUrl = env.DATABASE_URL
 */
import { z } from 'zod'

const EnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Payload CMS
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
  PAYLOAD_PUBLIC_SERVER_URL: z.string().url(),

  // Web app
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  REVALIDATE_SECRET: z.string().min(16, 'REVALIDATE_SECRET must be at least 16 characters'),

  // Object storage adapter (ADR-003) — default S3-compatible (R2)
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_PUBLIC_BASE_URL: z.string().url(),

  // Edge/CDN adapter (ADR-003) — optional in dev (no-op adapter)
  EDGE_PROVIDER: z.enum(['cloudflare', 'aws', 'bunny', 'none']).default('none'),
  EDGE_API_TOKEN: z.string().optional(),
  EDGE_ZONE_ID: z.string().optional(),

  // Analytics (optional until Phase 1 wires them)
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_SRC: z.string().url().optional(),
  NEXT_PUBLIC_GA4_ID: z.string().optional(),

  // Phase 3+ (optional now)
  NEXT_PUBLIC_ONESIGNAL_APP_ID: z.string().optional(),
  ONESIGNAL_REST_API_KEY: z.string().optional(),
  NEWSLETTER_PROVIDER: z.string().optional(),
  NEWSLETTER_API_KEY: z.string().optional(),
  NEWSLETTER_API_BASE: z.string().url().optional(),

  // Ads
  NEXT_PUBLIC_ADSENSE_CLIENT: z.string().optional(),
})

export type AppEnv = z.infer<typeof EnvSchema>

/**
 * Parse and validate process.env. Throws a human-readable error listing every
 * problem at once (rather than failing one var at a time).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(source)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(
      `Invalid environment configuration. Fix the following before starting:\n${issues}\n` +
        `See .env.example for the full contract.`,
    )
  }
  return parsed.data
}

/**
 * Lazily-validated env. Access `env.DATABASE_URL` etc. and the first access triggers
 * validation (throws on missing/invalid). Importing the module is side-effect-free, so
 * tests and CI don't crash simply by importing code that re-exports env.
 *
 * Apps should call `loadEnv()` explicitly at boot to fail fast before serving requests;
 * the lazy singleton is a convenience for library code that reads env only if used.
 */
export const env = new Proxy({} as AppEnv, {
  get(_target, prop: string) {
    const validated = loadEnv()
    return validated[prop as keyof AppEnv]
  },
})
