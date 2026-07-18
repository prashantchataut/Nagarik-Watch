import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Authors } from './collections/Authors'
import { Tags } from './collections/Tags'
import { Articles } from './collections/Articles'
import { loadEnv } from '@nagarikwatch/db/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Build-safe env access.
 *
 * Payload's config module is imported at `next build` time (the catch-all
 * `/api/[payload]` route pulls in `@payload-config`). If we call `loadEnv()`
 * at module top-level, the build fails in the Vercel sandbox whenever any
 * required var is absent or the DB isn't reachable — which is the default for
 * a fresh deploy.
 *
 * Strategy: read directly from `process.env` with build-time fallbacks so the
 * config module always evaluates; defer the strict `loadEnv()` check to
 * runtime (server boot) where the real env is guaranteed present. The
 * `serverURL` and `secret` are only needed when the server runs, not at build.
 */
const isBuild = process.env.NEXT_PHASE === 'phase-production-build'
const PAYLOAD_SECRET =
  process.env.PAYLOAD_SECRET ?? (isBuild ? 'build-placeholder-not-used-at-runtime' : undefined)
const DATABASE_URL =
  process.env.DATABASE_URL ??
  (isBuild ? 'postgres://build-placeholder.not.used.at.runtime/db' : undefined)
const SERVER_URL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ??
  (isBuild ? 'http://localhost:3001' : undefined)

/**
 * Validate env at runtime (NOT at build). Called once on first server boot
 * via the `onInit` hook — fails fast with a clear message if production env
 * is missing, but never blocks `next build`.
 */
function validateAtBoot() {
  if (isBuild) return
  loadEnv()
}

/**
 * Payload CMS root config for Nagarik Watch.
 *
 * Canonical editorial configuration: Users, Media, Category, Author, Tag and
 * Article with role-aware access, drafts, provenance validation, scheduling,
 * versions and publish-to-reader revalidation.
 */
export default buildConfig({
  secret: PAYLOAD_SECRET as string,
  serverURL: SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Brand the admin in Civic Crimson (DESIGN.md Palette A) so editors see the product.
    components: {
      beforeNavLinks: ['@/components/BrandMark#BrandMark'],
    },
    meta: {
      titleSuffix: ' · Nagarik Watch CMS',
      title: 'नागरिक वाच',
      icons: [{ type: 'icon', rel: 'icon', url: '/favicon.ico' }],
    },
  },
  collections: [Users, Media, Categories, Authors, Tags, Articles],
  globals: [],
  editor: lexicalEditor(),
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  },
  // Validate env once the server actually boots — never during `next build`.
  onInit: validateAtBoot,
  db: postgresAdapter({
    pool: {
      connectionString: DATABASE_URL as string,
    },
    // Dev pushes the schema live (fast iteration). Prod runs against generated
    // migrations (source of truth) so schema changes are reviewed and ordered.
    // Set PAYLOAD_DB_PUSH=false in production; defaults to true for local dev.
    push:
      process.env.PAYLOAD_DB_PUSH !== undefined
        ? process.env.PAYLOAD_DB_PUSH === 'true'
        : process.env.NODE_ENV !== 'production',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
