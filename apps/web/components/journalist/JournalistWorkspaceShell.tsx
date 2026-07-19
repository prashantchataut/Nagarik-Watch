import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistSignOutButton } from '@/components/journalist/JournalistSignOutButton'

export function JournalistWorkspaceShell({
  locale,
  name,
  roleLabel,
  active,
  children,
}: {
  locale: Locale
  name: string
  roleLabel: string
  active: 'dashboard' | 'assignments' | 'new' | 'tools' | 'feedback' | 'profile'
  children: ReactNode
}) {
  const ne = locale === 'ne'
  const items = [
    ['dashboard', '/journalist/dashboard', ne ? 'डेस्क' : 'Desk'],
    ['assignments', '/journalist/assignments', ne ? 'मेरा समाचार' : 'My stories'],
    ['new', '/journalist/articles/new', ne ? 'नयाँ ड्राफ्ट' : 'New draft'],
    ['tools', '/journalist/tools', ne ? 'लेखन उपकरण' : 'Tools'],
    ['profile', '/journalist/profile', ne ? 'प्रोफाइल' : 'Profile'],
  ] as const

  const mobileItems = [
    ['dashboard', '/journalist/dashboard', ne ? 'डेस्क' : 'Desk'],
    ['assignments', '/journalist/assignments', ne ? 'समाचार' : 'Stories'],
    ['new', '/journalist/articles/new', ne ? 'नयाँ' : 'New'],
    ['tools', '/journalist/tools', ne ? 'उपकरण' : 'Tools'],
    ['profile', '/journalist/profile', ne ? 'प्रोफाइल' : 'Profile'],
  ] as const

  return (
    <div className="newsroom-workspace min-h-screen" lang={ne ? 'ne' : 'en'}>
      <a className="skip-link" href="#newsroom-main">
        {ne ? 'मुख्य सामग्रीमा जानुहोस्' : 'Skip to content'}
      </a>
      <aside className="newsroom-sidebar">
        <Link
          href={localizeHref(locale, '/journalist/dashboard')}
          className="newsroom-sidebar__brand"
        >
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          <span>{ne ? 'रिपोर्टर डेस्क' : 'Reporter desk'}</span>
        </Link>
        <nav aria-label={ne ? 'पत्रकार नेभिगेसन' : 'Journalist navigation'}>
          {items.map(([key, href, label], index) => (
            <Link
              key={key}
              href={localizeHref(locale, href)}
              aria-current={active === key ? 'page' : undefined}
            >
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {label}
            </Link>
          ))}
          <Link
            href={localizeHref(locale, '/journalist/feedback')}
            aria-current={active === 'feedback' ? 'page' : undefined}
          >
            <span aria-hidden="true">06</span>
            {ne ? 'प्रतिक्रिया' : 'Feedback'}
          </Link>
        </nav>
        <div className="newsroom-sidebar__identity">
          <strong>{name}</strong>
          <span>{roleLabel}</span>
          <Link href={localizeHref(locale, '/')}>
            {ne ? 'सार्वजनिक साइट हेर्नुहोस्' : 'View public site'}
          </Link>
          <JournalistSignOutButton locale={locale} />
        </div>
      </aside>
      <div className="newsroom-main" id="newsroom-main">
        <header
          className="newsroom-mobilebar"
          aria-label={ne ? 'पत्रकार छोटो नेभिगेसन' : 'Journalist quick navigation'}
        >
          {mobileItems.map(([key, href, label]) => (
            <Link
              key={key}
              href={localizeHref(locale, href)}
              aria-current={active === key ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </header>
        {children}
      </div>
    </div>
  )
}
