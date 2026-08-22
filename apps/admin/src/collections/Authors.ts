import type { CollectionConfig } from 'payload'
import {
  anyone,
  hardDeleteRoles,
  hasAnyRole,
  newsroomInternalRoles,
  taxonomyManagerRoles,
  withRoles,
} from '../access/rbac'

function canReadPrivateAuthorField({ req }: { req: { user?: unknown } }): boolean {
  return hasAnyRole(req.user, newsroomInternalRoles)
}

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'role'],
    group: 'मानिस',
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
      access: { read: canReadPrivateAuthorField },
      admin: {
        description: 'Internal contact address. Never exposed through the public author API.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
