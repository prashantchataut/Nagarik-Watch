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
  'viewer',
  'contributor',
  'journalist',
  'photo_video_editor',
  'copy_editor',
  'fact_checker',
  'reviewer',
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
  viewer: 'दर्शक',
  contributor: 'योगदानकर्ता',
  journalist: 'पत्रकार',
  photo_video_editor: 'फोटो/भिडियो सम्पादक',
  reviewer: 'समीक्षक',
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
  viewer: 'Viewer',
  contributor: 'Contributor',
  journalist: 'Journalist / Reporter',
  photo_video_editor: 'Photo / Video Editor',
  reviewer: 'Reviewer',
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
  'reviewer',
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
  'reviewer',
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

/** Roles that can change public taxonomy and author directories. */
export const TAXONOMY_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  ...EDITOR_ROLES,
  'seo_manager',
])

/** Roles that can review reader messages, submissions, comments and polls. */
export const COMMUNITY_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  ...COMMENT_MODERATOR_ROLES,
  ...EDITOR_ROLES,
])

/** Roles that can add or edit newsroom media metadata. */
export const MEDIA_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'photo_video_editor',
  ...EDITOR_ROLES,
])

/** Roles that can change publication-wide settings. */
export const SETTINGS_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'publisher',
  'admin',
  'super_admin',
])

/** Roles that can manage premium access and manual subscriptions. */
export const MEMBERSHIP_MANAGER_ROLES: ReadonlySet<NewsroomRole> = SETTINGS_MANAGER_ROLES

/** Roles that can create and queue newsletter issues. */
export const NEWSLETTER_MANAGER_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'analyst',
  'publisher',
  'admin',
  'super_admin',
])

export function assertNewsroomRole(role: NewsroomRole, allowed: ReadonlySet<NewsroomRole>): void {
  if (!allowed.has(role)) throw new Error('Permission denied for this newsroom role.')
}

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

/** Roles allowed into the admin shell at all. Journalists/contributors use /journalist/* instead. */
export const ADMIN_BASE_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'viewer',
  'reviewer',
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
])

/** Server-side route access matrix for the custom web admin. */
export const ADMIN_PATH_ROLE_RULES: ReadonlyArray<{
  prefix: string
  roles: ReadonlySet<NewsroomRole>
}> = [
  { prefix: '/admin/users', roles: USER_MANAGER_ROLES },
  { prefix: '/admin/roles', roles: USER_MANAGER_ROLES },
  { prefix: '/admin/audit-log', roles: USER_MANAGER_ROLES },
  {
    prefix: '/admin/algorithms',
    roles: new Set<NewsroomRole>([
      'analyst',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/experiments',
    roles: new Set<NewsroomRole>([
      'analyst',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/session-quality',
    roles: new Set<NewsroomRole>([
      'analyst',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/search-analytics',
    roles: new Set<NewsroomRole>([
      'analyst',
      'seo_manager',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/journalists',
    roles: new Set<NewsroomRole>([
      'reviewer',
      'assistant_editor',
      'sub_editor',
      'section_editor',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/live',
    roles: new Set<NewsroomRole>([
      'viewer',
      'reviewer',
      'analyst',
      'moderator',
      'ad_manager',
      'seo_manager',
      'managing_editor',
      'editor_in_chief',
      'publisher',
      'admin',
      'super_admin',
    ]),
  },
  { prefix: '/admin/comments', roles: COMMENT_MODERATOR_ROLES },
  { prefix: '/admin/contact', roles: COMMUNITY_MANAGER_ROLES },
  { prefix: '/admin/submissions', roles: COMMUNITY_MANAGER_ROLES },
  { prefix: '/admin/polls', roles: COMMUNITY_MANAGER_ROLES },
  { prefix: '/admin/categories', roles: TAXONOMY_MANAGER_ROLES },
  { prefix: '/admin/tags', roles: TAXONOMY_MANAGER_ROLES },
  { prefix: '/admin/topics', roles: TAXONOMY_MANAGER_ROLES },
  { prefix: '/admin/provinces', roles: TAXONOMY_MANAGER_ROLES },
  { prefix: '/admin/authors', roles: TAXONOMY_MANAGER_ROLES },
  { prefix: '/admin/media', roles: MEDIA_MANAGER_ROLES },
  { prefix: '/admin/live-blogs', roles: EDITOR_ROLES },
  { prefix: '/admin/wire', roles: EDITOR_ROLES },
  { prefix: '/admin/settings', roles: SETTINGS_MANAGER_ROLES },
  { prefix: '/admin/paywall', roles: MEMBERSHIP_MANAGER_ROLES },
  {
    prefix: '/admin/ads',
    roles: new Set<NewsroomRole>(['ad_manager', 'publisher', 'admin', 'super_admin']),
  },
  {
    prefix: '/admin/newsletter',
    roles: NEWSLETTER_MANAGER_ROLES,
  },
  {
    prefix: '/admin/seo',
    roles: new Set<NewsroomRole>([
      'seo_manager',
      'assistant_editor',
      'sub_editor',
      'section_editor',
      'managing_editor',
      'editor_in_chief',
      'admin',
      'super_admin',
    ]),
  },
  {
    prefix: '/admin/live-widgets',
    roles: new Set<NewsroomRole>([
      'analyst',
      'assistant_editor',
      'sub_editor',
      'section_editor',
      'managing_editor',
      'editor_in_chief',
      'admin',
      'super_admin',
    ]),
  },
]

/** Roles that use the journalist writing desk (`/journalist/*`), not `/admin`. */
export const JOURNALIST_DESK_ROLES: ReadonlySet<NewsroomRole> = new Set([
  'contributor',
  'journalist',
  'photo_video_editor',
])

export type AdminDeskVariant = 'super' | 'admin' | 'editor' | 'ops'

/** Visual/product desk identity for the admin shell. */
export function resolveAdminDeskVariant(role: NewsroomRole): AdminDeskVariant {
  if (role === 'super_admin') return 'super'
  if (role === 'admin') return 'admin'
  if (
    role === 'publisher' ||
    role === 'seo_manager' ||
    role === 'moderator' ||
    role === 'ad_manager' ||
    role === 'analyst' ||
    role === 'viewer'
  ) {
    return 'ops'
  }
  return 'editor'
}

export function adminDeskLabelNe(variant: AdminDeskVariant): string {
  switch (variant) {
    case 'super':
      return 'सुपर एडमिन कन्सोल'
    case 'admin':
      return 'एडमिन कन्सोल'
    case 'ops':
      return 'सञ्चालन डेस्क'
    default:
      return 'सम्पादकीय डेस्क'
  }
}

export function adminDeskLabelEn(variant: AdminDeskVariant): string {
  switch (variant) {
    case 'super':
      return 'Super admin console'
    case 'admin':
      return 'Admin console'
    case 'ops':
      return 'Operations desk'
    default:
      return 'Editorial desk'
  }
}

export function isJournalistDeskRole(role: NewsroomRole): boolean {
  return JOURNALIST_DESK_ROLES.has(role)
}

export function canAccessAdminPath(role: NewsroomRole, pathname: string): boolean {
  const rule = ADMIN_PATH_ROLE_RULES.find(
    (item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  )
  if (!ADMIN_BASE_ROLES.has(role)) return false
  if (!rule) return true
  return rule.roles.has(role)
}
