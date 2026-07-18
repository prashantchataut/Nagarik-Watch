import type { CollectionConfig } from 'payload'
import {
  createUserOrBootstrap,
  hardDeleteRoles,
  hasAnyRole,
  newsroomInternalRoles,
  ownUserOrManager,
  userManagerRoles,
  withRoles,
} from '../access/rbac'

const canManageUsers = ({ req }: { req: { user?: unknown } }): boolean =>
  hasAnyRole(req.user, userManagerRoles)

/**
 * Users — authenticated newsroom accounts. Reader identities live in the reader app and are
 * intentionally not mixed with CMS credentials.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: ownUserOrManager,
    create: createUserOrBootstrap,
    update: ownUserOrManager,
    delete: withRoles(hardDeleteRoles),
    // Payload types `admin`/`unlock` as boolean-only Access, not Where queries.
    admin: ({ req }) => hasAnyRole(req.user, newsroomInternalRoles),
    unlock: ({ req }) => hasAnyRole(req.user, userManagerRoles),
  },
  auth: {
    useAPIKey: true,
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user.isActive === false) {
          throw new Error('This newsroom account has been disabled. Contact an administrator.')
        }
        return user
      },
    ],
    beforeChange: [
      async ({ data, operation, req }) => {
        if (!data) return data

        if (operation === 'create') {
          const existing = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (existing.totalDocs === 0) {
            return {
              ...data,
              roles: ['super_admin'],
              isActive: true,
            }
          }
        }

        return data
      },
    ],
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles', 'isActive'],
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
      defaultValue: ['journalist'],
      access: {
        create: canManageUsers,
        update: canManageUsers,
      },
      options: [
        { label: 'Reader (legacy CMS account)', value: 'reader' },
        { label: 'Read-only Newsroom Viewer', value: 'viewer' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Journalist / Reporter', value: 'journalist' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Photo / Video Editor', value: 'photo_video_editor' },
        { label: 'Copy Editor', value: 'copy_editor' },
        { label: 'Fact Checker', value: 'fact_checker' },
        { label: 'Assistant Editor', value: 'assistant_editor' },
        { label: 'Sub Editor', value: 'sub_editor' },
        { label: 'Section Editor', value: 'section_editor' },
        { label: 'Province Editor', value: 'province_editor' },
        { label: 'Managing Editor', value: 'managing_editor' },
        { label: 'Editor in Chief', value: 'editor_in_chief' },
        { label: 'SEO Manager', value: 'seo_manager' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Ad Manager', value: 'ad_manager' },
        { label: 'Analyst', value: 'analyst' },
        { label: 'Publisher / Owner', value: 'publisher' },
        { label: 'Admin', value: 'admin' },
        { label: 'Super Admin', value: 'super_admin' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Only administrators can change newsroom roles.',
      },
    },
    {
      name: 'section',
      type: 'select',
      hasMany: true,
      access: {
        create: canManageUsers,
        update: canManageUsers,
      },
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
        description: 'Sections this user can edit. Only administrators can change scope.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        create: canManageUsers,
        update: canManageUsers,
      },
      admin: {
        position: 'sidebar',
        description: 'Disabled accounts cannot log in or pass role checks.',
      },
    },
  ],
}

