'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { NewsroomSession } from '@/lib/auth/session'
import type { NewsroomRole } from '@/lib/admin-roles'
import { NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { LogoMark } from '@/components/Logo'

type NavItem = {
  label: string
  href: string
  icon: string
  roles?: ReadonlySet<NewsroomRole>
}

/**
 * Newsroom admin shell. Three-zone layout modelled on national-grade CMS
 * dashboards (Payload, Ghost, Pico):
 *   - Left sidebar: brand mark + collapsible nav grouped by function.
 *   - Top bar: page title, search, user menu (profile, sign out).
 *   - Main: the page content.
 *
 * The sidebar is fixed on desktop (lg+) and a slide-over drawer on mobile.
 * Active nav item gets a brand-tint pill; the rest are quiet text links.
 *
 * Role gating: each nav item can declare which roles see it. A journalist
 * never sees the Users or Ads sections; an ad manager never sees Editorial.
 * The server-side session check is the real gate; this is defence-in-depth.
 */
const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'सम्पादन',
    items: [
      { label: 'ड्यासबोर्ड', href: '/admin/dashboard', icon: 'dashboard' },
      { label: 'समाचार', href: '/admin/articles', icon: 'article' },
      { label: 'नयाँ समाचार', href: '/admin/articles/new', icon: 'plus' },
      { label: 'मिडिया', href: '/admin/media', icon: 'media' },
      { label: 'लाइभ ब्लग', href: '/admin/live-blogs', icon: 'live' },
    ],
  },
  {
    heading: 'वर्गीकरण',
    items: [
      { label: 'विभाग', href: '/admin/categories', icon: 'category' },
      { label: 'ट्याग', href: '/admin/tags', icon: 'tag' },
      { label: 'विषय', href: '/admin/topics', icon: 'topic' },
      { label: 'प्रदेश', href: '/admin/provinces', icon: 'province' },
      { label: 'लेखक', href: '/admin/authors', icon: 'author' },
    ],
  },
  {
    heading: 'समुदाय',
    items: [
      { label: 'टिप्पणी', href: '/admin/comments', icon: 'comment' },
      { label: 'टिप', href: '/admin/submissions', icon: 'tip' },
      { label: 'मतदान', href: '/admin/polls', icon: 'poll' },
      { label: 'न्युजलेटर', href: '/admin/newsletter', icon: 'newsletter' },
    ],
  },
  {
    heading: 'सञ्चालन',
    items: [
      { label: 'लाइभ विजेट', href: '/admin/live-widgets', icon: 'widget' },
      { label: 'विज्ञापन', href: '/admin/ads', icon: 'ad' },
      { label: 'एसइओ', href: '/admin/seo', icon: 'seo' },
      { label: 'प्रयोगकर्ता', href: '/admin/users', icon: 'user', roles: new Set(['admin', 'super_admin']) },
      { label: 'भूमिका', href: '/admin/roles', icon: 'role', roles: new Set(['admin', 'super_admin']) },
      { label: 'अडिट लग', href: '/admin/audit-log', icon: 'audit', roles: new Set(['admin', 'super_admin']) },
      { label: 'सेटिङ', href: '/admin/settings', icon: 'settings' },
    ],
  },
]

export function AdminShell({
  session,
  pathname: initialPathname,
  children,
}: {
  session: NewsroomSession
  pathname?: string
  children: React.ReactNode
}) {
  const clientPath = usePathname() ?? initialPathname ?? ''
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, startSignOut] = useTransition()

  const role = session.newsroomRole
  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role
  const initials = (session.displayName || session.email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  function signOut() {
    startSignOut(async () => {
      await fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {})
      router.refresh()
      router.push('/admin/login')
    })
  }

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.roles || item.roles.has(role)),
  })).filter((g) => g.items.length > 0)

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-rule bg-surface-raised">
      <div className="flex h-16 items-center gap-2.5 border-b border-rule px-5">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <LogoMark title="नागरिक वाच / Nagarik Watch" className="h-9 w-9" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-body font-bold text-ink" lang="ne">
              नागरिक वाच
            </span>
            <span className="text-caption text-mute" lang="en">
              Newsroom
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Newsroom navigation">
        {visibleGroups.map((group) => (
          <div key={group.heading} className="mb-5">
            <p
              className="px-3 pb-2 text-caption font-semibold uppercase tracking-wide text-mute"
              lang="ne"
            >
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  clientPath === item.href ||
                  (clientPath.startsWith(item.href + '/') && item.href !== '/admin/dashboard')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={
                        active
                          ? 'flex items-center gap-3 rounded-md bg-brand-tint px-3 py-2 text-meta font-semibold text-brand-strong'
                          : 'flex items-center gap-3 rounded-md px-3 py-2 text-meta font-medium text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint/60 hover:text-brand-strong'
                      }
                      lang="ne"
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-rule p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-meta font-bold text-surface"
            aria-hidden="true"
          >
            {initials || 'N'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-meta font-semibold text-ink" lang="ne">
              {session.displayName || session.email}
            </p>
            <p className="truncate text-caption text-mute" lang="ne">
              {roleLabel}
            </p>
          </div>
          <button
            onClick={signOut}
            disabled={signingOut}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-50"
            aria-label="साइन आउट"
            title="साइन आउट"
          >
            <NavIcon name="logout" />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Desktop sidebar — fixed width, hidden on mobile. */}
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">{sidebar}</div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 h-full">{sidebar}</div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-rule bg-surface-raised/95 px-4 backdrop-blur lg:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-soft hover:bg-brand-tint hover:text-brand-strong lg:hidden"
            aria-label="मेनु खोल्नुहोस्"
          >
            <NavIcon name="menu" />
          </button>
          <h1 className="flex-1 truncate font-display text-h2 text-ink" lang="ne">
            {pageTitle(clientPath)}
          </h1>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-rule px-3.5 py-1.5 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong sm:inline-flex"
            lang="ne"
          >
            <NavIcon name="external" />
            साइट हेर्नुहोस्
          </a>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

function pageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/admin/dashboard': 'ड्यासबोर्ड',
    '/admin/articles': 'समाचार',
    '/admin/articles/new': 'नयाँ समाचार',
    '/admin/media': 'मिडिया',
    '/admin/categories': 'विभाग',
    '/admin/tags': 'ट्याग',
    '/admin/topics': 'विषय',
    '/admin/provinces': 'प्रदेश',
    '/admin/authors': 'लेखक',
    '/admin/comments': 'टिप्पणी',
    '/admin/submissions': 'टिप',
    '/admin/polls': 'मतदान',
    '/admin/newsletter': 'न्युजलेटर',
    '/admin/live-blogs': 'लाइभ ब्लग',
    '/admin/live-widgets': 'लाइभ विजेट',
    '/admin/ads': 'विज्ञापन',
    '/admin/seo': 'एसइओ',
    '/admin/users': 'प्रयोगकर्ता',
    '/admin/roles': 'भूमिका',
    '/admin/audit-log': 'अडिट लग',
    '/admin/settings': 'सेटिङ',
  }
  return map[pathname] ?? 'न्युजरुम'
}

function NavIcon({ name }: { name: string }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false as const,
  }
  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    case 'article':
      return (
        <svg {...props}>
          <path d="M4 5h16M4 5v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5M8 10h8M8 14h6" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'media':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="m21 17-5-5-9 9" />
        </svg>
      )
    case 'live':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      )
    case 'category':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...props}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <circle cx="7" cy="7" r="1.5" />
        </svg>
      )
    case 'topic':
      return (
        <svg {...props}>
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        </svg>
      )
    case 'province':
      return (
        <svg {...props}>
          <path d="M12 22s8-7 8-13a8 8 0 0 0-16 0c0 6 8 13 8 13z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      )
    case 'author':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )
    case 'comment':
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'tip':
      return (
        <svg {...props}>
          <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
        </svg>
      )
    case 'poll':
      return (
        <svg {...props}>
          <path d="M5 21V10M12 21V4M19 21v-7" />
        </svg>
      )
    case 'newsletter':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )
    case 'widget':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </svg>
      )
    case 'ad':
      return (
        <svg {...props}>
          <path d="M3 11l18-5v12L3 14v-3z" />
          <path d="M7 14v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-3" />
        </svg>
      )
    case 'seo':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      )
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      )
    case 'role':
      return (
        <svg {...props}>
          <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
        </svg>
      )
    case 'audit':
      return (
        <svg {...props}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...props}>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      )
    case 'external':
      return (
        <svg {...props}>
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <path d="M15 3h6v6M10 14L21 3" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
