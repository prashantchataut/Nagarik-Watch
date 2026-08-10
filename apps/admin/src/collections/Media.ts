import type { CollectionConfig } from 'payload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { anyone, hardDeleteRoles, newsroomContributorRoles, withRoles } from '../access/rbac'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: anyone,
    create: withRoles(newsroomContributorRoles),
    update: withRoles(newsroomContributorRoles),
    delete: withRoles(hardDeleteRoles),
  },
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../public/media'),
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
    },
    {
      name: 'caption',
      type: 'textarea',
    },
  ],
}
