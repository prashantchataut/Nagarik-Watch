import type { CollectionConfig } from 'payload'

/**
 * Users — CMS accounts. Roles are stored on the user and drive access control across all
 * collections (see src/access/, editorial-workflow.md §1).
 *
 * Six roles: author, copyeditor, translator, editor, publisher, admin.
 * The `translator` role is scoped to English-version fields only (ADR-007).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    // Self-service read of own record; admins read all. Tightened in Slice 6.
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  auth: {
    // Payload's default email/password with a strong minimum; 2FA lands in Phase 5.
    useAPIKey: true,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
    group: 'People',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Display name (Devanagari or Latin as appropriate).',
      },
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['author'],
      options: [
        { label: 'Author', value: 'author' },
        { label: 'Copy Editor', value: 'copyeditor' },
        { label: 'Translator', value: 'translator' },
        { label: 'Editor (section)', value: 'editor' },
        { label: 'Publisher (desk lead)', value: 'publisher' },
        { label: 'Admin (technical)', value: 'admin' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Drives access control across all collections. Publisher + admin require 2FA (Phase 5).',
      },
    },
    {
      name: 'section',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'राजनीति (Politics)', value: 'politics' },
        { label: 'समाज (Society)', value: 'society' },
        { label: 'बजार (Business)', value: 'business' },
        { label: 'खेलकुद (Sports)', value: 'sports' },
        { label: 'मनोरञ्जन (Entertainment)', value: 'entertainment' },
        { label: 'विश्व (World)', value: 'world' },
        { label: 'ब्लग/राय (Opinion)', value: 'opinion' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Sections this user can edit. Editors are scoped to their section(s).',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Disable access without deleting the account.',
      },
    },
  ],
}
