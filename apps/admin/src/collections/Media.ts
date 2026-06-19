import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
