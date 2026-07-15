import type { NewsroomRole } from '@/lib/admin-roles'

/** Grouped role ladders for invite / assignment UI (not auth rules). */
export const ROLE_ASSIGNMENT_GROUPS: Array<{
  id: string
  labelNe: string
  labelEn: string
  hintNe: string
  hintEn: string
  roles: NewsroomRole[]
}> = [
  {
    id: 'reporting',
    labelNe: 'रिपोर्टिङ',
    labelEn: 'Reporting',
    hintNe: 'लेख लेख्ने / डेस्कमा काम गर्ने भूमिका',
    hintEn: 'Can draft and work from the journalist desk',
    roles: ['contributor', 'journalist', 'photo_video_editor'],
  },
  {
    id: 'editing',
    labelNe: 'सम्पादन',
    labelEn: 'Editing',
    hintNe: 'समीक्षा, कपी र तथ्य-जाँच',
    hintEn: 'Review, copy-edit and fact-check',
    roles: ['viewer', 'reviewer', 'copy_editor', 'fact_checker', 'assistant_editor', 'sub_editor'],
  },
  {
    id: 'desk-leads',
    labelNe: 'डेस्क नेतृत्व',
    labelEn: 'Desk leads',
    hintNe: 'विभाग / प्रदेश सम्पादक',
    hintEn: 'Section and province editors',
    roles: ['section_editor', 'province_editor', 'managing_editor', 'editor_in_chief'],
  },
  {
    id: 'operations',
    labelNe: 'सञ्चालन',
    labelEn: 'Operations',
    hintNe: 'SEO, मोडरेशन, विज्ञापन, एनालिटिक्स',
    hintEn: 'SEO, moderation, ads and analytics',
    roles: ['seo_manager', 'moderator', 'ad_manager', 'analyst', 'publisher'],
  },
  {
    id: 'admins',
    labelNe: 'प्रशासन',
    labelEn: 'Administration',
    hintNe: 'प्रयोगकर्ता र प्रणाली व्यवस्थापन',
    hintEn: 'User and system administration',
    roles: ['admin', 'super_admin'],
  },
]

export function roleGroupsForAssignable(roles: NewsroomRole[]) {
  const allowed = new Set(roles)
  return ROLE_ASSIGNMENT_GROUPS.map((group) => ({
    ...group,
    roles: group.roles.filter((role) => allowed.has(role)),
  })).filter((group) => group.roles.length > 0)
}
