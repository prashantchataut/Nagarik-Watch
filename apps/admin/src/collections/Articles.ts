import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titleNe',
    defaultColumns: ['titleNe', 'category', '_status', 'publishedAt', 'sourceType'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  fields: [
    {
      name: 'titleNe',
      type: 'text',
      required: true,
      maxLength: 120,
      label: 'Title (Nepali)',
    },
    {
      name: 'titleEn',
      type: 'text',
      label: 'Title (English)',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'deckNe',
      type: 'textarea',
      label: 'Deck (Nepali)',
    },
    {
      name: 'deckEn',
      type: 'textarea',
      label: 'Deck (English)',
    },
    {
      name: 'bodyNe',
      type: 'json',
      required: true,
      label: 'Body (Nepali)',
    },
    {
      name: 'bodyEn',
      type: 'json',
      label: 'Body (English)',
    },
    {
      name: 'englishStatus',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Requested', value: 'requested' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Ready', value: 'ready' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'englishBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'relationship',
          relationTo: 'tags',
        },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'authors',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'authors',
          required: true,
        },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'heroCaption',
      type: 'text',
    },
    {
      name: 'heroCredit',
      type: 'text',
    },
    {
      name: 'sourceType',
      type: 'select',
      required: true,
      defaultValue: 'original',
      options: [
        { label: 'Original', value: 'original' },
        { label: 'Aggregated', value: 'aggregated' },
        { label: 'Wire', value: 'wire' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'sourceName',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType && siblingData.sourceType !== 'original',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType && siblingData.sourceType !== 'original',
      },
    },
    {
      name: 'sourcePublishedAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) => siblingData?.sourceType && siblingData.sourceType !== 'original',
      },
    },
    {
      name: 'isBreaking',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredState',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'Lead', value: 'lead' },
        { label: 'Secondary', value: 'secondary' },
        { label: 'None', value: 'none' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      defaultValue: 'ne',
      options: [
        { label: 'Nepali', value: 'ne' },
        { label: 'English', value: 'en' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'seoTitle',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
    {
      name: 'seoImage',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'corrections',
      type: 'array',
      fields: [
        {
          name: 'at',
          type: 'date',
          required: true,
        },
        {
          name: 'summary',
          type: 'textarea',
          required: true,
        },
        {
          name: 'madeBy',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
      ],
    },
    {
      name: 'adFree',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'commentsEnabled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && data.sourceType && data.sourceType !== 'original') {
          if (!data.sourceName || !data.sourceUrl) {
            throw new Error('sourceName and sourceUrl are required when sourceType is not original')
          }
        }
      },
    ],
  },
}
