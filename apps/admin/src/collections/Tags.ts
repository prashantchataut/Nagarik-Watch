import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'nameNe',
    defaultColumns: ['nameNe', 'nameEn', 'slug'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
