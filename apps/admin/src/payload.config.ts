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

// Validate env at boot so misconfiguration fails fast before serving the admin.
const env = loadEnv()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Payload CMS root config for Nagarik Watch.
 *
 * Phase 1 lands the core content model (content-model.md §1–5): Users, Media, Category,
 * Author, Tag and Article. Access control is open in dev (tightened in Slice 6 / Phase 2);
 * the Article source-attribution hook is already in place.
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
  collections: [Users, Media, Categories, Authors, Tags, Articles],
  globals: [],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    // Prod uses migrations (source of truth). Dev pushes the schema live; flip to false
    // once a migrations workflow is in place (Slice 8).
    push: true,
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
