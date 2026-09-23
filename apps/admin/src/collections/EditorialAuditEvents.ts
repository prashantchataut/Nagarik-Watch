import type { CollectionConfig } from 'payload'
import { editorialManagerRoles, withRoles } from '../access/rbac'

export const EditorialAuditEvents: CollectionConfig = {
  slug: 'editorial-audit-events',
  admin: {
    group: 'प्रशासन',
    useAsTitle: 'eventType',
    defaultColumns: ['occurredAt', 'eventType', 'resourceLabel', 'actorEmail'],
    description: 'Immutable editorial workflow, publication, correction, and AI-use ledger.',
  },
  access: {
    read: withRoles(editorialManagerRoles),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'occurredAt',
      type: 'date',
      required: true,
      index: true,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Article created', value: 'article_created' },
        { label: 'Workflow transition', value: 'workflow_transition' },
        { label: 'Publication status changed', value: 'publication_status_changed' },
        { label: 'Correction changed', value: 'correction_changed' },
        { label: 'AI assistance changed', value: 'ai_assistance_changed' },
      ],
      admin: { readOnly: true },
    },
    { name: 'resourceType', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'resourceId', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'resourceLabel', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'actorId', type: 'text', admin: { readOnly: true } },
    { name: 'actorEmail', type: 'email', admin: { readOnly: true } },
    { name: 'fromValue', type: 'text', admin: { readOnly: true } },
    { name: 'toValue', type: 'text', admin: { readOnly: true } },
    { name: 'metadata', type: 'json', admin: { readOnly: true } },
  ],
  timestamps: false,
}
