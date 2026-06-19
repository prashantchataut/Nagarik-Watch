import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Users } from './collections/Users'
import { loadEnv } from '@nagarikwatch/db/env'

// Validate env at boot so misconfiguration fails fast before serving the admin.
const env = loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Payload CMS root config for Nagarik Watch.
 *
 * Collections and globals are added incrementally per docs/phase-2-tasks.md slices:
 *  - Slice 1 (this file): Users
 *  - Slice 2: Media
 *  - Slice 3: Category, Author, Tag
 *  - Slice 4: Article
 *  - Slice 5: globals
 *
 * Access control (Slice 6) and hooks (Slice 7) attach to each collection as it lands.
 */
export default buildConfig({
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
      icons: [
        { type: 'icon', rel: 'icon', url: '/favicon.ico' },
      ],
    },
  },
  collections: [Users],
  globals: [],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    // Schema push in dev; migrations are the source of truth in prod (Slice 8).
    pushRecreateOplogs: false,
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
