import type { CollectionConfig } from 'payload'
import { hardDeleteRoles, userManagerRoles, withRoles } from '../access/rbac'

/**
 * Users — CMS accounts. Roles are stored on the user and drive access control across all
 * collections (see src/access/, editorial-workflow.md §1).
 *
 * Newsroom roles follow the production RBAC model in AGENT.md. Legacy role strings are
 * mapped by access helpers so older seeded users do not get locked out during migration.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: withRoles(userManagerRoles),
    create: withRoles(userManagerRoles),
    update: withRoles(userManagerRoles),
    delete: withRoles(hardDeleteRoles),
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
      defaultValue: ['journalist'],
      options: [
        { label: 'Reader', value: 'reader' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Journalist / Reporter', value: 'journalist' },
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
