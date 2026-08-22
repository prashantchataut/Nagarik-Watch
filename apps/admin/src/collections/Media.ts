import type { CollectionConfig } from 'payload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { anyone, hardDeleteRoles, newsroomContributorRoles, withRoles } from '../access/rbac'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Align with apps/web media sniff allowlist minus GIF (prefer modern formats in CMS). */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'सम्पादन',
    description: 'JPEG, PNG, WebP, or AVIF up to 8MB. Alt and credit are required for publication.',
  },
  access: {
    read: anyone,
    create: withRoles(newsroomContributorRoles),
    update: withRoles(newsroomContributorRoles),
    delete: withRoles(hardDeleteRoles),
  },
  upload: {
    mimeTypes: [...ALLOWED_MIME_TYPES],
    staticDir: path.resolve(dirname, '../../public/media'),
    imageSizes: [
      {
        name: 'thumb',
        width: 320,
        height: 180,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'card',
        width: 640,
        height: 360,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'hero',
        width: 1280,
        height: 720,
        position: 'centre',
        withoutEnlargement: true,
      },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (!data) return data
        if (operation === 'create' || Object.prototype.hasOwnProperty.call(data, 'alt')) {
          if (!String(data.alt ?? '').trim()) {
            throw new Error('Alt text is required for every media upload.')
          }
        }
        if (operation === 'create' || Object.prototype.hasOwnProperty.call(data, 'credit')) {
          if (!String(data.credit ?? '').trim()) {
            throw new Error('Credit / provenance is required for every media upload.')
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'textarea',
      required: true,
      label: 'Alt text',
    },
    {
      name: 'credit',
      type: 'text',
      required: true,
      label: 'Credit / provenance',
    },
    {
      name: 'caption',
      type: 'textarea',
    },
    {
      name: 'sourceUrl',
      type: 'text',
      label: 'Source URL',
      admin: {
        description: 'Optional original asset URL for rights tracking.',
      },
    },
  ],
}
