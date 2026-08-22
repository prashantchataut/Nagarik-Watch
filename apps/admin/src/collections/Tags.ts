import type { CollectionConfig } from 'payload'
import { anyone, hardDeleteRoles, taxonomyManagerRoles, withRoles } from '../access/rbac'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'nameNe',
    defaultColumns: ['nameNe', 'nameEn', 'slug'],
    group: 'वर्गीकरण',
  },
  access: {
    read: anyone,
    create: withRoles(taxonomyManagerRoles),
    update: withRoles(taxonomyManagerRoles),
    delete: withRoles(hardDeleteRoles),
  },
  fields: [
    {
      name: 'nameNe',
      type: 'text',
      required: true,
      label: 'Name (Nepali)',
    },
    {
      name: 'nameEn',
      type: 'text',
      label: 'Name (English)',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
