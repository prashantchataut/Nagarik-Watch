/**
 * Maps Better Auth `role` values onto product-facing account kinds so the
 * public UI and admin panel can show reader vs journalist vs newsroom clearly.
 */
import {
  ADMIN_BASE_ROLES,
  CONTRIBUTOR_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
  type NewsroomRole,
} from '@/lib/admin-roles'

export type AccountKind = 'reader' | 'journalist' | 'newsroom' | 'admin'

export type AccountDeskLink = {
  href: string
  labelNe: string
  labelEn: string
}

const NEWSROOM_ROLE_SET: ReadonlySet<string> = new Set<string>([
  'viewer',
  'contributor',
  'journalist',
  'photo_video_editor',
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

export function isNewsroomRole(role: string): role is NewsroomRole {
  return NEWSROOM_ROLE_SET.has(role)
}

export function resolveAccountKind(role: string): AccountKind {
  if (role === 'admin' || role === 'super_admin') return 'admin'
  if (ADMIN_BASE_ROLES.has(role as NewsroomRole)) return 'newsroom'
  if (CONTRIBUTOR_ROLES.has(role as NewsroomRole)) return 'journalist'
  return 'reader'
}

export function accountKindLabel(kind: AccountKind, locale: 'ne' | 'en'): string {
  const ne = locale === 'ne'
  switch (kind) {
    case 'admin':
      return ne ? 'प्रशासन खाता' : 'Admin account'
    case 'newsroom':
      return ne ? 'न्यूजरुम खाता' : 'Newsroom account'
    case 'journalist':
      return ne ? 'पत्रकार खाता' : 'Journalist account'
    default:
      return ne ? 'पाठक खाता' : 'Reader account'
  }
}

export function roleDisplayLabel(role: string, locale: 'ne' | 'en'): string {
  if (isNewsroomRole(role) || role === 'reader') {
    const key = role as NewsroomRole
    return locale === 'ne' ? NEWSROOM_ROLE_LABELS_NE[key] : NEWSROOM_ROLE_LABELS_EN[key]
  }
  return locale === 'ne' ? 'पाठक' : 'Reader'
}

export function deskLinksForRole(role: string, locale: 'ne' | 'en'): AccountDeskLink[] {
  const kind = resolveAccountKind(role)
  const profile: AccountDeskLink = {
    href: locale === 'en' ? '/en/auth/profile' : '/auth/profile',
    labelNe: 'प्रोफाइल',
    labelEn: 'Profile',
  }
  const links: AccountDeskLink[] = [profile]

  if (kind === 'journalist' || kind === 'newsroom' || kind === 'admin') {
    if (CONTRIBUTOR_ROLES.has(role as NewsroomRole)) {
      links.push({
        href: locale === 'en' ? '/en/journalist/dashboard' : '/journalist/dashboard',
        labelNe: 'पत्रकार डेस्क',
        labelEn: 'Journalist desk',
      })
    }
  }
  if (kind === 'newsroom' || kind === 'admin') {
    links.push({
      href: '/admin',
      labelNe: 'एडमिन प्यानल',
      labelEn: 'Admin panel',
    })
  }
  return links
}

export function accountKindBadgeClass(kind: AccountKind): string {
  switch (kind) {
    case 'admin':
      return 'border-breaking/40 bg-brand-tint text-brand-strong'
    case 'newsroom':
      return 'border-brand/30 bg-brand-tint text-brand-strong'
    case 'journalist':
      return 'border-rule bg-surface-raised text-ink'
    default:
      return 'border-rule bg-surface text-ink-soft'
  }
}
