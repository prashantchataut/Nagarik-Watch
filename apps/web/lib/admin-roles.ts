/**
 * Newsroom RBAC roles. Mirrors the Payload CMS Users collection roles
 * (apps/admin/src/collections/Users.ts) and the editorial workflow
 * (docs/editorial-workflow.md). The web app uses these to guard /admin/*
 * routes and to render role-scoped UI.
 *
 * Role ordering reflects the editorial ladder (bottom = least authority,
 * top = most). `super_admin` is the only role that can hard-delete.
 */
export const NEWSROOM_ROLES = [
  'reader',
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
  'moderator',
  'ad_manager',
  'analyst',
  'publisher',
  'admin',
  'super_admin',
] as const

export type NewsroomRole = (typeof NEWSROOM_ROLES)[number]

export const NEWSROOM_ROLE_LABELS_NE: Record<NewsroomRole, string> = {
  reader: 'पाठक',
  contributor: 'योगदानकर्ता',
  journalist: 'पत्रकार',
  photo_video_editor: 'फोटो/भिडियो सम्पादक',
  copy_editor: 'कपी सम्पादक',
  fact_checker: 'तथ्य-जाँचकर्ता',
  assistant_editor: 'सहायक सम्पादक',
  sub_editor: 'उप-सम्पादक',
  section_editor: 'विभागीय सम्पादक',
  province_editor: 'प्रदेश सम्पादक',
  managing_editor: 'व्यवस्थापक सम्पादक',
  editor_in_chief: 'प्रधान सम्पादक',
  seo_manager: 'एसइओ व्यवस्थापक',
  moderator: 'मॉडरेटर',
  ad_manager: 'विज्ञापन व्यवस्थापक',
  analyst: 'विश्लेषक',
  publisher: 'प्रकाशक',
  admin: 'एडमिन',
  super_admin: 'मुख्य एडमिन',
}

export const NEWSROOM_ROLE_LABELS_EN: Record<NewsroomRole, string> = {
  reader: 'Reader',
  contributor: 'Contributor',
  journalist: 'Journalist / Reporter',
  photo_video_editor: 'Photo / Video Editor',
  copy_editor: 'Copy Editor',
  fact_checker: 'Fact Checker',
  assistant_editor: 'Assistant Editor',
  sub_editor: 'Sub Editor',
  section_editor: 'Section Editor',
  province_editor: 'Province Editor',
  managing_editor: 'Managing Editor',
  editor_in_chief: 'Editor in Chief',
  seo_manager: 'SEO Manager',
  moderator: 'Moderator',
  ad_manager: 'Ad Manager',
  analyst: 'Analyst',
  publisher: 'Publisher / Owner',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

/** Roles that can create or submit articles. */
export const CONTRIBUTOR_ROLES: ReadonlySet<NewsroomRole> = new Set([
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
])

/** Roles that can edit any article and move it through the workflow. */
export const EDITOR_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
])

/** Roles that can publish (move from ready → published). */
export const PUBLISHER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
])

/** Roles that can hard-delete. Super admin only, by design. */
export const HARD_DELETE_ROLES: ReadonlySet<NewsroomRole> = new Set(['super_admin'])


/** Roles that can moderate reader comments. */
export const COMMENT_MODERATOR_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'moderator',
  'assistant_editor',
  'sub_editor',
  'section_editor',
  'province_editor',
  'managing_editor',
  'editor_in_chief',
  'admin',
  'super_admin',
])

/** Roles that can manage users and roles. */
export const USER_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set(['admin', 'super_admin'])

export function canCreate(role: NewsroomRole): boolean {
  return CONTRIBUTOR_ROLES.has(role)
}
export function canEdit(role: NewsroomRole): boolean {
  return EDITOR_ROLES.has(role)
}
export function canPublish(role: NewsroomRole): boolean {
  return PUBLISHER_ROLES.has(role)
}
export function canDelete(role: NewsroomRole): boolean {
  return HARD_DELETE_ROLES.has(role)
}
export function canModerateComments(role: NewsroomRole): boolean {
  return COMMENT_MODERATOR_ROLES.has(role)
}
export function canManageUsers(role: NewsroomRole): boolean {
  return USER_MANAGER_ROLES.has(role)
}


/** Server-side route access matrix for the custom web admin. */
export const ADMIN_PATH_ROLE_RULES: ReadonlyArray<{ prefix: string; roles: ReadonlySet<NewsroomRole> }> = [
  { prefix: '/admin/users', roles: USER_MANAGER_ROLES },
  { prefix: '/admin/roles', roles: USER_MANAGER_ROLES },
  { prefix: '/admin/audit-log', roles: USER_MANAGER_ROLES },
  { prefix: '/admin/comments', roles: COMMENT_MODERATOR_ROLES },
  { prefix: '/admin/ads', roles: new Set<NewsroomRole>(['ad_manager', 'publisher', 'admin', 'super_admin']) },
  { prefix: '/admin/newsletter', roles: new Set<NewsroomRole>(['analyst', 'publisher', 'admin', 'super_admin']) },
  { prefix: '/admin/seo', roles: new Set<NewsroomRole>(['seo_manager', 'assistant_editor', 'sub_editor', 'section_editor', 'managing_editor', 'editor_in_chief', 'admin', 'super_admin']) },
  { prefix: '/admin/live-widgets', roles: new Set<NewsroomRole>(['analyst', 'assistant_editor', 'sub_editor', 'section_editor', 'managing_editor', 'editor_in_chief', 'admin', 'super_admin']) },
]

export function canAccessAdminPath(role: NewsroomRole, pathname: string): boolean {
  const rule = ADMIN_PATH_ROLE_RULES.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`))
  if (!rule) return true
  return rule.roles.has(role)
}
