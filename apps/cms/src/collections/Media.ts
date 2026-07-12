import type { CollectionConfig } from 'payload'
import { anyone, hardDeleteRoles, newsroomContributorRoles, withRoles } from '../access/rbac'

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
