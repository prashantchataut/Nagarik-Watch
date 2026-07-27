import Link from 'next/link'
import type { NewsroomRole } from '@/lib/admin-roles'
import {
  canCreate,
  canModerateComments,
  COMMUNITY_MANAGER_ROLES,
  EDITOR_ROLES,
  MEDIA_MANAGER_ROLES,
} from '@/lib/admin-roles'

type FlowLink = { href: string; label: string; hint: string }

function flowsForRole(role: NewsroomRole): FlowLink[] {
  const flows: FlowLink[] = []

  if (canCreate(role)) {
    flows.push({
      href: '/admin/articles/new',
      label: 'नयाँ समाचार',
      hint: 'लेख तयार गर्नुहोस्',
    })
  }
  if (EDITOR_ROLES.has(role)) {
    flows.push({
      href: '/admin/journalists',
      label: 'पत्रकार समीक्षा',
      hint: 'ड्राफ्ट इनबक्स',
    })
  }
  if (MEDIA_MANAGER_ROLES.has(role)) {
    flows.push({
      href: '/admin/media',
      label: 'फोटो अपलोड',
      hint: 'मिडिया लाइब्रेरी',
    })
  }
  if (COMMUNITY_MANAGER_ROLES.has(role) || canModerateComments(role)) {
    flows.push({
      href: '/admin/submissions',
      label: 'पाठक टिप',
      hint: 'सबमिशन क्यु',
    })
    flows.push({
      href: '/admin/comments',
      label: 'टिप्पणी',
      hint: 'मोडरेशन',
    })
  }
  flows.push({
    href: '/journalist/articles/new',
    label: 'रिपोर्टर ड्राफ्ट',
    hint: 'पत्रकार डेस्क',
  })

  const seen = new Set<string>()
  return flows.filter((flow) => {
    if (seen.has(flow.href)) return false
    seen.add(flow.href)
    return true
  })
}

export function AdminWorkflowStrip({ role }: { role: NewsroomRole }) {
  const flows = flowsForRole(role)
  if (flows.length === 0) return null

  return (
    <nav
      className="admin-workflow-strip"
      aria-label="सम्पादकीय प्रवाह"
      lang="ne"
    >
      <p className="admin-workflow-strip__label">कार्य प्रवाह</p>
      <ul className="admin-workflow-strip__list">
        {flows.map((flow) => (
          <li key={flow.href}>
            <Link href={flow.href} className="admin-workflow-strip__link">
              <span className="admin-workflow-strip__title">{flow.label}</span>
              <span className="admin-workflow-strip__hint">{flow.hint}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
