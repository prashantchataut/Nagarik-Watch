import type { CollectionConfig } from 'payload'
import {
  assignedArticleOrEditorialManager,
  editorialManagerRoles,
  hardDeleteRoles,
  hasAnyRole,
  newsroomContributorRoles,
  newsroomInternalRoles,
  publishingRoles,
  publishedOrNewsroom,
  rolesFromUser,
  withRoles,
} from '../access/rbac'
import { revalidatePublishedArticle } from '../hooks/revalidate'

type WorkflowStage =
  | 'idea'
  | 'assigned'
  | 'draft'
  | 'submitted'
  | 'fact_check'
  | 'copy_edit'
  | 'seo_review'
  | 'legal_review'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'updated'
  | 'archived'
  | 'retracted'

const publicControlStages = new Set<WorkflowStage>([
  'scheduled',
  'published',
  'updated',
  'archived',
  'retracted',
])

const allowedBlockTypes = new Set([
  'paragraph',
  'heading2',
  'heading3',
  'image',
  'pullQuote',
  'embed',
  'list',
  'adSlot',
])

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function canReadInternalField({ req }: { req: { user?: unknown } }): boolean {
  return hasAnyRole(req.user, newsroomInternalRoles)
}

function canManageAssignments({ req }: { req: { user?: unknown } }): boolean {
  return hasAnyRole(req.user, editorialManagerRoles)
}

function canPublishField({ req }: { req: { user?: unknown } }): boolean {
  return hasAnyRole(req.user, publishingRoles)
}

function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function validateArticleBlocks(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return 'bodyNe must contain at least one block.'

  for (const [index, rawBlock] of value.entries()) {
    const block = asRecord(rawBlock)
    const type = typeof block.type === 'string' ? block.type : ''
    if (!allowedBlockTypes.has(type)) return `bodyNe block ${index + 1} has an unsupported type.`

    if (['paragraph', 'heading2', 'heading3'].includes(type) && !String(block.text ?? '').trim()) {
      return `bodyNe block ${index + 1} requires text.`
    }
    if (type === 'pullQuote' && !String(block.quoteNe ?? '').trim()) {
      return `bodyNe block ${index + 1} requires quoteNe.`
    }
    if (type === 'list' && (!Array.isArray(block.items) || block.items.length === 0)) {
      return `bodyNe block ${index + 1} requires at least one list item.`
    }
    if (type === 'embed' && !isValidHttpUrl(block.url)) {
      return `bodyNe block ${index + 1} requires a valid http(s) embed URL.`
    }
    if (type === 'adSlot' && !String(block.placementKey ?? '').trim()) {
      return `bodyNe block ${index + 1} requires placementKey.`
    }
  }
  return null
}

function articleText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .flatMap((rawBlock) => {
      const block = asRecord(rawBlock)
      if (typeof block.text === 'string') return [block.text]
      if (typeof block.quoteNe === 'string') return [block.quoteNe]
      if (Array.isArray(block.items)) {
        return block.items.filter((item): item is string => typeof item === 'string')
      }
      return []
    })
    .join(' ')
}

function canUseWorkflowStage(user: unknown, stage: WorkflowStage): boolean {
  if (hasAnyRole(user, publishingRoles)) return true
  if (publicControlStages.has(stage)) return false
  if (hasAnyRole(user, editorialManagerRoles)) return true

  const roles = rolesFromUser(user)
  if (roles.has('fact_checker') || roles.has('reviewer')) {
    return ['submitted', 'fact_check'].includes(stage)
  }
  if (roles.has('copy_editor')) return ['submitted', 'copy_edit'].includes(stage)
  if (roles.has('seo_manager')) return ['seo_review', 'ready'].includes(stage)
  return ['idea', 'assigned', 'draft', 'submitted'].includes(stage)
}


export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'titleNe',
    defaultColumns: ['titleNe', 'category', '_status', 'publishAt', 'sourceType'],
    group: 'Content',
  },
  access: {
    read: publishedOrNewsroom,
    create: withRoles(newsroomContributorRoles),
    update: assignedArticleOrEditorialManager,
    delete: withRoles(hardDeleteRoles),
    readVersions: withRoles(newsroomInternalRoles),
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
      unique: true,
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
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'workflowStage',
      type: 'select',
      required: true,
      defaultValue: 'idea',
      options: [
        { label: 'Idea', value: 'idea' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'Draft', value: 'draft' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Fact Check', value: 'fact_check' },
        { label: 'Copy Edit', value: 'copy_edit' },
        { label: 'SEO Review', value: 'seo_review' },
        { label: 'Legal / Sensitivity Review', value: 'legal_review' },
        { label: 'Ready for Publish', value: 'ready' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Updated', value: 'updated' },
        { label: 'Archived', value: 'archived' },
        { label: 'Retracted', value: 'retracted' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      access: {
        read: canReadInternalField,
        create: canManageAssignments,
        update: canManageAssignments,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'editor',
      type: 'relationship',
      relationTo: 'users',
      access: {
        read: canReadInternalField,
        create: canManageAssignments,
        update: canManageAssignments,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'factChecker',
      type: 'relationship',
      relationTo: 'users',
      access: {
        read: canReadInternalField,
        create: canManageAssignments,
        update: canManageAssignments,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'copyEditor',
      type: 'relationship',
      relationTo: 'users',
      access: {
        read: canReadInternalField,
        create: canManageAssignments,
        update: canManageAssignments,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      access: { read: canReadInternalField },
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
        condition: (_, siblingData) =>
          siblingData?.sourceType && siblingData.sourceType !== 'original',
      },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) =>
          siblingData?.sourceType && siblingData.sourceType !== 'original',
      },
    },
    {
      name: 'sourcePublishedAt',
      type: 'date',
      admin: {
        condition: (_, siblingData) =>
          siblingData?.sourceType && siblingData.sourceType !== 'original',
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
      access: {
        create: canPublishField,
        update: canPublishField,
      },
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
      access: {
        create: canPublishField,
        update: canPublishField,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'factCheckedAt',
      type: 'date',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'copyEditedAt',
      type: 'date',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'seoReviewedAt',
      type: 'date',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'legalReviewedAt',
      type: 'date',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'readingMinutes',
      type: 'number',
      min: 1,
      admin: { position: 'sidebar' },
    },
    {
      name: 'wordCount',
      type: 'number',
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'readingDifficultyNote',
      type: 'textarea',
      access: { read: canReadInternalField },
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
      name: 'includeInNewsSitemap',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'aiSummary',
      type: 'textarea',
      access: { read: canReadInternalField },
      admin: { position: 'sidebar' },
    },
    {
      name: 'aiSummaryApproved',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'doNotRecommend',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'premium',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sensitive',
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
          access: { read: canReadInternalField },
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
      ({ data, originalDoc, operation, req }) => {
        if (!data) return data
        const original = asRecord(originalDoc)
        const full = { ...original, ...data }
        const stage = String(full.workflowStage ?? 'idea') as WorkflowStage
        const status = String(full._status ?? 'draft')

        if (operation === 'create' && req.user && !Array.isArray(data.assignedTo)) {
          data.assignedTo = [req.user.id]
        }

        if (full.sourceType && full.sourceType !== 'original') {
          if (!full.sourceName || !full.sourcePublishedAt || !isValidHttpUrl(full.sourceUrl)) {
            throw new Error(
              'Aggregated and wire stories require sourceName, a valid http(s) sourceUrl, and sourcePublishedAt.',
            )
          }
        }

        const bodyError = validateArticleBlocks(full.bodyNe)
        if (bodyError) throw new Error(bodyError)

        if (status === 'published' && /^\[(?:डेमो|demo)\]/i.test(String(full.titleNe ?? ''))) {
          throw new Error('Development demo articles cannot be published.')
        }

        const originalStage = String(original.workflowStage ?? stage) as WorkflowStage
        if (req.user) {
          if (!canUseWorkflowStage(req.user, stage)) {
            throw new Error(`Your newsroom role cannot move an article to the “${stage}” stage.`)
          }
          if (operation === 'update' && publicControlStages.has(originalStage) && !hasAnyRole(req.user, publishingRoles)) {
            throw new Error('Only publishing roles can modify scheduled, published, archived, or retracted stories.')
          }
          if (status === 'published' && !hasAnyRole(req.user, publishingRoles)) {
            throw new Error('Only publishing roles can publish an article.')
          }
        } else if (status === 'published' || publicControlStages.has(stage)) {
          throw new Error('Publishing requires an authenticated publishing account.')
        }

        if (stage === 'scheduled') {
          if (!full.publishAt) throw new Error('Scheduled articles require publishAt.')
          const scheduledAt = Date.parse(String(full.publishAt))
          if (!Number.isFinite(scheduledAt)) throw new Error('publishAt must be a valid date.')
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (!data) return data
        const original = asRecord(originalDoc)
        const full = { ...original, ...data }
        const normalized: Record<string, unknown> = { ...data }

        if (Object.prototype.hasOwnProperty.call(data, 'bodyNe') || !originalDoc) {
          const text = articleText(full.bodyNe)
          const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
          normalized.wordCount = wordCount
          normalized.readingMinutes = Math.max(1, Math.ceil(wordCount / 180))
        }

        const status = String(full._status ?? 'draft')
        const requestedStage = String(full.workflowStage ?? 'idea') as WorkflowStage
        if (status === 'published') {
          const publishAt = String(full.publishAt || new Date().toISOString())
          const isFuture = Date.parse(publishAt) > Date.now()

          normalized.publishAt = publishAt
          if (requestedStage === 'archived' || requestedStage === 'retracted') {
            normalized.workflowStage = requestedStage
            normalized.noIndex = true
            normalized.includeInNewsSitemap = false
            normalized.featuredState = 'none'
          } else {
            normalized.workflowStage = isFuture
              ? 'scheduled'
              : requestedStage === 'updated'
                ? 'updated'
                : 'published'
            normalized.noIndex = false
            normalized.includeInNewsSitemap = normalized.includeInNewsSitemap !== false
          }
        } else if (!publicControlStages.has(requestedStage)) {
          normalized.noIndex = true
          normalized.includeInNewsSitemap = false
          normalized.featuredState = 'none'
        }

        return normalized
      },
    ],
    afterChange: [revalidatePublishedArticle],
  },
}
