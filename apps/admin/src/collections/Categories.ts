import type { CollectionConfig } from 'payload'
import { anyone, hardDeleteRoles, taxonomyManagerRoles, withRoles } from '../access/rbac'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'nameNe',
    defaultColumns: ['nameNe', 'nameEn', 'slug', 'navOrder', 'showInNav'],
    group: 'Content',
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
      required: true,
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'navOrder',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'showInNav',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
