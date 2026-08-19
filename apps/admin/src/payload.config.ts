import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.NEON_DATABASE_URL ??
  (isBuild ? 'postgres://build-placeholder.not.used.at.runtime/db' : undefined)
const SERVER_URL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ?? (isBuild ? 'http://localhost:3001' : undefined)

function adminDatabasePoolConfig(connectionString: string) {
  let hostname = ''
  try {
    hostname = new URL(connectionString).hostname.toLowerCase()
  } catch {
    return { connectionString }
  }

  const explicit = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim()
  const relaxTls =
    explicit === 'false' ||
    (explicit !== 'true' &&
      (hostname.endsWith('.aivencloud.com') || hostname.endsWith('.aiven.io')))

  if (!relaxTls) return { connectionString }

  const url = new URL(connectionString)
  url.searchParams.delete('ssl')
  url.searchParams.delete('sslmode')
  url.searchParams.delete('uselibpqcompat')
  url.searchParams.set('sslmode', 'no-verify')
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
  }
}

/**
 * Validate env at runtime (NOT at build). Called once on first server boot
 * via the `onInit` hook — fails fast with a clear message if production env
 * is missing, but never blocks `next build`.
 */
function validateAtBoot() {
  if (isBuild) return
  loadEnv({
    ...process.env,
    // Keep the CMS aligned with the web app's accepted Vercel/Neon aliases,
    // while preserving DATABASE_URL as the canonical validated key.
    DATABASE_URL,
  })
  const isProd = process.env.NODE_ENV === 'production'
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (isProd && !blobToken) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is required in production so Payload Media uploads land on durable Vercel Blob storage.',
    )
  }
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
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
      collections: {
        media: {
          prefix: 'nagarik-watch/media',
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      addRandomSuffix: true,
      cacheControlMaxAge: 31_536_000,
    }),
  ],
  globals: [],
  editor: lexicalEditor(),
  upload: {
    abortOnLimit: true,
    limits: {
      // Align with apps/web MAX_MEDIA_BYTES (8MB). Vercel desk Blob path stays at 4MB.
      fileSize: 8 * 1024 * 1024,
    },
  },
  // Validate env once the server actually boots — never during `next build`.
  onInit: validateAtBoot,
  db: postgresAdapter({
    pool: adminDatabasePoolConfig(DATABASE_URL as string),
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
