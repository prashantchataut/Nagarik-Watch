import type { CollectionConfig } from 'payload'
import { anyone, hardDeleteRoles, taxonomyManagerRoles, withRoles } from '../access/rbac'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'role'],
    group: 'People',
  },
  access: {
    read: anyone,
    create: withRoles(taxonomyManagerRoles),
    update: withRoles(taxonomyManagerRoles),
    delete: withRoles(hardDeleteRoles),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'staff',
      options: [
        { label: 'Staff', value: 'staff' },
        { label: 'Columnist', value: 'columnist' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Wire', value: 'wire' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
