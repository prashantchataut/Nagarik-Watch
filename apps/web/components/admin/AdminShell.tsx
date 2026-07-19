'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { NewsroomSession } from '@/lib/auth/session'
import type { NewsroomRole } from '@/lib/admin-roles'
import {
  adminDeskLabelNe,
  canCreate,
  COMMUNITY_MANAGER_ROLES,
  EDITOR_ROLES,
  MEDIA_MANAGER_ROLES,
  MEMBERSHIP_MANAGER_ROLES,
  NEWSLETTER_MANAGER_ROLES,
  NEWSROOM_ROLE_LABELS_NE,
  resolveAdminDeskVariant,
  SETTINGS_MANAGER_ROLES,
  TAXONOMY_MANAGER_ROLES,
  type AdminDeskVariant,
} from '@/lib/admin-roles'
import { signOutRequest } from '@/lib/auth/sign-out-client'
import { LogoMark } from '@/components/Logo'

type NavItem = {
  label: string
  href: string
  icon: string
  roles?: ReadonlySet<NewsroomRole>
}

const PAYLOAD_CONTENT_PATHS: Record<string, string> = {
  '/admin/articles': '/collections/articles',
  '/admin/articles/new': '/collections/articles/create',
  '/admin/media': '/collections/media',
  '/admin/categories': '/collections/categories',
  '/admin/tags': '/collections/tags',
  '/admin/authors': '/collections/authors',
}

const ANALYTICS_ROLES = new Set<NewsroomRole>([
  'analyst',
  'managing_editor',
  'editor_in_chief',
  'publisher',
  'admin',
  'super_admin',
])

function primaryNavFor(desk: AdminDeskVariant, role: NewsroomRole): NavItem[] {
  const items: NavItem[] = [{ label: 'ड्यासबोर्ड', href: '/admin/dashboard', icon: 'dashboard' }]
  if (desk === 'editor' || desk === 'admin' || desk === 'super') {
    items.push({ label: 'समाचार', href: '/admin/articles', icon: 'article' })
  }
  if (canCreate(role) && desk !== 'ops') {
    items.push({ label: 'नयाँ समाचार', href: '/admin/articles/new', icon: 'plus' })
  }
  if (desk === 'editor') {
    items.push({ label: 'पत्रकार इनबक्स', href: '/admin/journalists', icon: 'author' })
  }
  if (desk === 'admin' || desk === 'super') {
    items.push({ label: 'प्रयोगकर्ता', href: '/admin/users', icon: 'user' })
  }
  if (desk === 'super') {
    items.push({ label: 'लन्च चेक', href: '/admin/launch', icon: 'audit' })
  }
  return items
}

const NAV_GROUPS: {
  heading: string
  items: NavItem[]
  roles?: ReadonlySet<NewsroomRole>
  defaultOpen?: boolean
}[] = [
  {
    heading: 'सम्पादन',
    defaultOpen: true,
    roles: EDITOR_ROLES,
    items: [
      { label: 'मिडिया', href: '/admin/media', icon: 'media', roles: MEDIA_MANAGER_ROLES },
      { label: 'लाइभ ब्लग', href: '/admin/live-blogs', icon: 'live', roles: EDITOR_ROLES },
      { label: 'पत्रकार डेस्क', href: '/admin/journalists', icon: 'author', roles: EDITOR_ROLES },
    ],
  },
  {
    heading: 'वर्गीकरण',
    roles: TAXONOMY_MANAGER_ROLES,
    items: [
      {
        label: 'विभाग',
        href: '/admin/categories',
        icon: 'category',
        roles: TAXONOMY_MANAGER_ROLES,
      },
      { label: 'ट्याग', href: '/admin/tags', icon: 'tag', roles: TAXONOMY_MANAGER_ROLES },
      { label: 'विषय', href: '/admin/topics', icon: 'topic', roles: TAXONOMY_MANAGER_ROLES },
      {
        label: 'प्रदेश',
        href: '/admin/provinces',
        icon: 'province',
        roles: TAXONOMY_MANAGER_ROLES,
      },
      { label: 'लेखक', href: '/admin/authors', icon: 'author', roles: TAXONOMY_MANAGER_ROLES },
    ],
  },
  {
    heading: 'समुदाय',
    roles: COMMUNITY_MANAGER_ROLES,
    items: [
      {
        label: 'टिप्पणी',
        href: '/admin/comments',
        icon: 'comment',
        roles: COMMUNITY_MANAGER_ROLES,
      },
      { label: 'टिप', href: '/admin/submissions', icon: 'tip', roles: COMMUNITY_MANAGER_ROLES },
      { label: 'सम्पर्क', href: '/admin/contact', icon: 'comment', roles: COMMUNITY_MANAGER_ROLES },
      { label: 'मतदान', href: '/admin/polls', icon: 'poll', roles: COMMUNITY_MANAGER_ROLES },
      {
        label: 'न्युजलेटर',
        href: '/admin/newsletter',
        icon: 'newsletter',
        roles: NEWSLETTER_MANAGER_ROLES,
      },
    ],
  },
  {
    heading: 'प्रकाशक / सञ्चालन',
    roles: new Set<NewsroomRole>([
      'publisher',
      'admin',
      'super_admin',
      'managing_editor',
      'editor_in_chief',
      'seo_manager',
      'ad_manager',
      'analyst',
      'moderator',
      'viewer',
    ]),
    items: [
      { label: 'लाइभ प्यानल', href: '/admin/live', icon: 'signal' },
      { label: 'एल्गोरिदम', href: '/admin/algorithms', icon: 'algorithm' },
      { label: 'प्रयोग', href: '/admin/experiments', icon: 'algorithm' },
      {
        label: 'सेसन गुणस्तर',
        href: '/admin/session-quality',
        icon: 'signal',
        roles: ANALYTICS_ROLES,
      },
      { label: 'खोज विश्लेषण', href: '/admin/search-analytics', icon: 'seo' },
      { label: 'लाइभ विजेट', href: '/admin/live-widgets', icon: 'widget' },
      { label: 'विज्ञापन', href: '/admin/ads', icon: 'ad' },
      {
        label: 'सदस्यता',
        href: '/admin/paywall',
        icon: 'membership',
        roles: MEMBERSHIP_MANAGER_ROLES,
      },
      { label: 'एसइओ', href: '/admin/seo', icon: 'seo' },
      { label: 'सेटिङ', href: '/admin/settings', icon: 'settings', roles: SETTINGS_MANAGER_ROLES },
    ],
  },
  {
    heading: 'एडमिन',
    roles: new Set<NewsroomRole>(['admin']),
    items: [
      { label: 'भूमिका', href: '/admin/roles', icon: 'role' },
      { label: 'अडिट लग', href: '/admin/audit-log', icon: 'audit' },
    ],
  },
  {
    heading: 'सुपर एडमिन',
    roles: new Set<NewsroomRole>(['super_admin']),
    defaultOpen: true,
    items: [
      { label: 'भूमिका', href: '/admin/roles', icon: 'role' },
      { label: 'अडिट लग', href: '/admin/audit-log', icon: 'audit' },
    ],
  },
]

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === '/admin/dashboard') return false
  return pathname.startsWith(href + '/')
}

export function AdminShell({
  session,
  pathname: initialPathname,
  children,
  contentAdminUrl,
}: {
  session: NewsroomSession
  pathname?: string
  children: ReactNode
  contentAdminUrl?: string
}) {
  const clientPath = usePathname() ?? initialPathname ?? ''
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [signingOut, startSignOut] = useTransition()
  const [navPending, startNav] = useTransition()
  const [signOutError, setSignOutError] = useState<string | null>(null)

  const role = session.newsroomRole
  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role
  const desk = resolveAdminDeskVariant(role)
  const deskLabel = adminDeskLabelNe(desk)
  const primaryNav = primaryNavFor(desk, role)
  const primaryHrefs = new Set(primaryNav.map((item) => item.href))
  const initials = (session.displayName || session.email)
    .split(/[\s@.]+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  const visibleGroups = NAV_GROUPS.filter((g) => !g.roles || g.roles.has(role))
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) => (!item.roles || item.roles.has(role)) && !primaryHrefs.has(item.href),
      ),
    }))
    .filter((g) => g.items.length > 0)

  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  function signOut() {
    setSignOutError(null)
    startSignOut(async () => {
      try {
        const response = await signOutRequest()
        if (!response.ok) throw new Error(`Sign-out failed: ${response.status}`)
        router.replace('/admin/login')
      } catch {
        setSignOutError('साइन आउट गर्न सकिएन। कृपया फेरि प्रयास गर्नुहोस्।')
      }
    })
  }

  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)

    const drawer = drawerRef.current
    const focusables = drawer
      ? Array.from(
          drawer.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1)
      : []
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    first?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || focusables.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keydown', onKeyDown)
      menuButtonRef.current?.focus()
    }
  }, [drawerOpen])

  function resolveHref(href: string) {
    const payloadPath = contentAdminUrl ? PAYLOAD_CONTENT_PATHS[href] : undefined
    return {
      href: payloadPath ? `${contentAdminUrl}${payloadPath}` : href,
      external: Boolean(payloadPath),
    }
  }

  const sidebarProps = {
    clientPath,
    initials,
    roleLabel,
    desk,
    deskLabel,
    primaryNav,
    session,
    visibleGroups,
    signingOut,
    signOut,
    resolveHref,
    onNavigate: () => setDrawerOpen(false),
    startNav,
  }

  return (
    <div className="admin-shell-surface flex min-h-screen bg-surface" data-desk={desk}>
      <div className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
        <AdminSidebar {...sidebarProps} />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Newsroom navigation">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45"
            aria-label="मेनु बन्द"
            onClick={() => setDrawerOpen(false)}
          />
          <div ref={drawerRef} className="absolute left-0 top-0 h-full shadow-overlay">
            <AdminSidebar {...sidebarProps} mobile onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-topbar">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink-soft hover:bg-brand-tint hover:text-brand-strong lg:hidden"
            aria-label="मेनु खोल्नुहोस्"
            aria-expanded={drawerOpen}
          >
            <NavIcon name="menu" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="admin-topbar__title" lang="ne">
              {pageTitle(clientPath)}
            </h1>
            {navPending ? (
              <p className="admin-topbar__meta" lang="ne">
                लोड हुँदै…
              </p>
            ) : (
              <p className="admin-topbar__meta" lang="ne">
                {deskLabel}
              </p>
            )}
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-button admin-button--ghost hidden !min-h-9 sm:inline-flex"
            lang="ne"
          >
            <NavIcon name="external" />
            साइट
          </a>
        </header>

        {signOutError ? (
          <p
            role="alert"
            className="admin-callout admin-callout--danger mx-3 mt-3 text-meta font-semibold sm:mx-5 lg:mx-7"
            lang="ne"
          >
            {signOutError}
          </p>
        ) : null}

        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

function AdminSidebar({
  clientPath,
  initials,
  roleLabel,
  desk,
  deskLabel,
  primaryNav,
  session,
  visibleGroups,
  signingOut,
  signOut,
  resolveHref,
  onNavigate,
  startNav,
  mobile = false,
  onClose,
}: {
  clientPath: string
  initials: string
  roleLabel: string
  desk: AdminDeskVariant
  deskLabel: string
  primaryNav: NavItem[]
  session: NewsroomSession
  visibleGroups: { heading: string; items: NavItem[]; defaultOpen?: boolean }[]
  signingOut: boolean
  signOut: () => void
  resolveHref: (href: string) => { href: string; external: boolean }
  onNavigate: () => void
  startNav: (cb: () => void) => void
  mobile?: boolean
  onClose?: () => void
}) {
  function navClass(active: boolean) {
    return active ? 'admin-nav-link admin-nav-link--active' : 'admin-nav-link'
  }

  return (
    <aside className="admin-sidebar flex h-full flex-col" data-desk={desk}>
      <div className="flex h-12 min-h-12 items-center gap-2 border-b border-rule px-2.5">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <LogoMark title="नागरिक वाच / Nagarik Watch" className="h-7 w-7 shrink-0" />
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-meta font-bold text-ink" lang="ne">
              न्यूजरुम
            </span>
            <span className="admin-desk-badge block truncate text-[0.62rem] uppercase">
              {deskLabel}
            </span>
          </div>
        </Link>
        {mobile && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-brand-tint hover:text-brand-strong"
            aria-label="मेनु बन्द"
          >
            <NavIcon name="close" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2.5" aria-label="Newsroom navigation">
        <ul className="space-y-0.5">
          {primaryNav.map((item) => {
            const { href, external } = resolveHref(item.href)
            const active = !external && isActivePath(clientPath, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={href}
                  prefetch={!external}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  onClick={() => {
                    onNavigate()
                    if (!external) startNav(() => undefined)
                  }}
                  className={navClass(active)}
                  lang="ne"
                >
                  <NavIcon name={item.icon} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        {visibleGroups.map((group) => (
          <details
            key={group.heading}
            className="group/nav mt-2.5"
            open={group.defaultOpen || group.items.some((i) => isActivePath(clientPath, i.href))}
          >
            <summary className="cursor-pointer list-none px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-mute [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1" lang="ne">
                {group.heading}
                <span className="text-mute transition-transform group-open/nav:rotate-90">›</span>
              </span>
            </summary>
            <ul className="mt-0.5 space-y-0.5">
              {group.items.map((item) => {
                const { href, external } = resolveHref(item.href)
                const active = !external && isActivePath(clientPath, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={href}
                      prefetch={!external}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      onClick={() => {
                        onNavigate()
                        if (!external) startNav(() => undefined)
                      }}
                      className={navClass(active)}
                      lang="ne"
                    >
                      <NavIcon name={item.icon} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {external ? <span aria-hidden="true">↗</span> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </details>
        ))}
      </nav>

      <div className="border-t border-rule p-2.5">
        <div className="flex items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand text-caption font-bold text-surface">
            {initials || 'N'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-meta font-semibold text-ink" lang="ne">
              {session.displayName || session.email}
            </p>
            <p className="truncate text-caption text-mute" lang="ne">
              {roleLabel}
            </p>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="admin-button admin-button--ghost mt-1.5 !min-h-8 !px-2 !py-1 !text-caption"
              lang="ne"
            >
              {signingOut ? 'साइन आउट…' : 'साइन आउट'}
            </button>
          </div>
        </div>
      </div>
    </aside>
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
    '/admin/journalists': 'पत्रकार डेस्क',
    '/admin/comments': 'टिप्पणी',
    '/admin/contact': 'सम्पर्क',
    '/admin/submissions': 'टिप',
    '/admin/polls': 'मतदान',
    '/admin/newsletter': 'न्युजलेटर',
    '/admin/live-blogs': 'लाइभ ब्लग',
    '/admin/live': 'लाइभ प्यानल',
    '/admin/algorithms': 'एल्गोरिदम',
    '/admin/experiments': 'प्रयोग',
    '/admin/session-quality': 'सेसन गुणस्तर',
    '/admin/search-analytics': 'खोज विश्लेषण',
    '/admin/live-widgets': 'लाइभ विजेट',
    '/admin/ads': 'विज्ञापन',
    '/admin/seo': 'एसइओ',
    '/admin/users': 'प्रयोगकर्ता',
    '/admin/roles': 'भूमिका',
    '/admin/audit-log': 'अडिट लग',
    '/admin/settings': 'सेटिङ',
    '/admin/paywall': 'सदस्यता',
    '/admin/launch': 'लन्च चेक',
  }
  if (map[pathname]) return map[pathname]
  if (pathname.startsWith('/admin/articles/') && pathname.endsWith('/edit')) return 'समाचार सम्पादन'
  return 'न्यूजरुम'
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
    case 'signal':
      return (
        <svg {...props}>
          <path d="M4 19V5M10 19v-9M16 19V8M22 19v-5" />
        </svg>
      )
    case 'algorithm':
      return (
        <svg {...props}>
          <path d="M6 4h12v5H6zM4 15h6v5H4zM14 15h6v5h-6zM12 9v3M7 12h10M7 12v3M17 12v3" />
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
    case 'close':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
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
