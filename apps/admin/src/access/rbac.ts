import type { Access, Where } from 'payload'

export type NewsroomRole =
  | 'reader'
  | 'viewer'
  | 'contributor'
  | 'journalist'
  | 'reviewer'
  | 'photo_video_editor'
  | 'copy_editor'
  | 'fact_checker'
  | 'assistant_editor'
  | 'sub_editor'
  | 'section_editor'
  | 'province_editor'
  | 'managing_editor'
  | 'editor_in_chief'
  | 'seo_manager'
  | 'moderator'
  | 'ad_manager'
  | 'analyst'
  | 'publisher'
  | 'admin'
  | 'super_admin'

const ROLE_ALIASES: Record<string, NewsroomRole> = {
  author: 'journalist',
  copyeditor: 'copy_editor',
  editor: 'section_editor',
  translator: 'copy_editor',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isActiveUser(user: unknown): user is Record<string, unknown> {
  return isRecord(user) && user.isActive !== false
}

export function rolesFromUser(user: unknown): Set<NewsroomRole> {
  if (!isActiveUser(user)) return new Set()
  const rawRoles = user.roles
  if (!Array.isArray(rawRoles)) return new Set()

  const roles = new Set<NewsroomRole>()
  for (const rawRole of rawRoles) {
    if (typeof rawRole !== 'string') continue
    const normalized = ROLE_ALIASES[rawRole] ?? rawRole
    roles.add(normalized as NewsroomRole)
  }
  return roles
}

export function hasAnyRole(user: unknown, allowed: readonly NewsroomRole[]): boolean {
  const roles = rolesFromUser(user)
  return allowed.some((role) => roles.has(role))
}

export const anyone: Access = () => true

export const signedIn: Access = ({ req }) => isActiveUser(req.user)

export function withRoles(allowed: readonly NewsroomRole[]): Access {
  return ({ req }) => hasAnyRole(req.user, allowed)
}

/** Roles allowed to enter the newsroom and inspect unpublished editorial documents. */
export const newsroomInternalRoles = [
  'viewer',
  'contributor',
  'journalist',
  'reviewer',
  'photo_video_editor',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'seo_manager',
  'moderator',
  'ad_manager',
  'analyst',
  'publisher',
  'admin',
  'super_admin',
] as const satisfies readonly NewsroomRole[]

/** Roles allowed to create or contribute to editorial documents. */
export const newsroomContributorRoles = [
  'contributor',
  'journalist',
  'reviewer',
  'photo_video_editor',
  'copy_editor',
  'fact_checker',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'seo_manager',
  'publisher',
  'admin',
  'super_admin',
] as const satisfies readonly NewsroomRole[]

export const editorialManagerRoles = [
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
] as const satisfies readonly NewsroomRole[]

/** Only these roles can schedule, publish, update, archive, or retract public journalism. */
export const publishingRoles = [
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
] as const satisfies readonly NewsroomRole[]

export const taxonomyManagerRoles = [
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'seo_manager',
  'publisher',
  'admin',
  'super_admin',
] as const satisfies readonly NewsroomRole[]

export const userManagerRoles = ['admin', 'super_admin'] as const satisfies readonly NewsroomRole[]

export const hardDeleteRoles = ['super_admin'] as const satisfies readonly NewsroomRole[]

/** Public readers see only articles that are genuinely public and whose publication time has arrived. */
export const publishedOrNewsroom: Access = ({ req }) => {
  if (hasAnyRole(req.user, newsroomInternalRoles)) return true
  const conditions: Where[] = [
    { _status: { equals: 'published' } },
    { workflowStage: { in: ['scheduled', 'published', 'updated'] } },
    { publishAt: { less_than_equal: new Date().toISOString() } },
    { noIndex: { not_equals: true } },
  ]
  return {
    and: conditions,
  }
}

/** Managers can edit all stories; contributors can edit stories assigned to their account. */
export const assignedArticleOrEditorialManager: Access = ({ req }) => {
  if (hasAnyRole(req.user, editorialManagerRoles)) return true
  if (!req.user || !hasAnyRole(req.user, newsroomContributorRoles)) return false

  return {
    assignedTo: {
      equals: req.user.id,
    },
  }
}

/** A user may read/update their own account; account managers may act on all users. */
export const ownUserOrManager: Access = ({ req }) => {
  if (hasAnyRole(req.user, userManagerRoles)) return true
  if (!req.user || !isActiveUser(req.user)) return false
  return {
    id: {
      equals: req.user.id,
    },
  }
}

/** Permit the very first account to bootstrap the CMS; all later accounts require an admin. */
export const createUserOrBootstrap: Access = async ({ req }) => {
  if (hasAnyRole(req.user, userManagerRoles)) return true
  const existing = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
  })
  return existing.totalDocs === 0
}
