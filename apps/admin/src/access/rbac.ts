import type { Access } from 'payload'

export type NewsroomRole =
  | 'reader'
  | 'contributor'
  | 'journalist'
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

export function rolesFromUser(user: unknown): Set<NewsroomRole> {
  if (!isRecord(user)) return new Set()
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

export const signedIn: Access = ({ req }) => Boolean(req.user)

export function withRoles(allowed: readonly NewsroomRole[]): Access {
  return ({ req }) => hasAnyRole(req.user, allowed)
}

export const newsroomContributorRoles = [
  'contributor',
  'journalist',
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
