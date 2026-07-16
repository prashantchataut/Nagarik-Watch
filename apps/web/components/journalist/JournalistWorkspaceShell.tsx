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
    ['feedback', '/journalist/feedback', ne ? 'प्रतिक्रिया' : 'Feedback'],
    ['profile', '/journalist/profile', ne ? 'प्रोफाइल' : 'Profile'],
  ] as const

  return (
    <div className="newsroom-workspace" lang={ne ? 'ne' : 'en'}>
      <aside className="newsroom-sidebar">
        <Link href={localizeHref(locale, '/journalist/dashboard')} className="newsroom-sidebar__brand">
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          <span>{ne ? 'रिपोर्टर डेस्क' : 'Reporter desk'}</span>
        </Link>
        <nav aria-label={ne ? 'पत्रकार नेभिगेसन' : 'Journalist navigation'}>
          {items.map(([key, href, label]) => (
            <Link key={key} href={localizeHref(locale, href)} aria-current={active === key ? 'page' : undefined}>
              <span aria-hidden="true">{String(items.findIndex((item) => item[0] === key) + 1).padStart(2, '0')}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="newsroom-sidebar__identity">
          <strong>{name}</strong>
          <span>{roleLabel}</span>
          <Link href={localizeHref(locale, '/')}>{ne ? 'सार्वजनिक साइट हेर्नुहोस्' : 'View public site'}</Link>
          <JournalistSignOutButton locale={locale} />
        </div>
      </aside>
      <div className="newsroom-main">
        <header className="newsroom-mobilebar" aria-label={ne ? 'पत्रकार छोटो नेभिगेसन' : 'Journalist quick navigation'}>
          <Link href={localizeHref(locale, '/journalist/dashboard')}>{ne ? 'डेस्क' : 'Desk'}</Link>
          <Link href={localizeHref(locale, '/journalist/assignments')}>{ne ? 'समाचार' : 'Stories'}</Link>
          <Link href={localizeHref(locale, '/journalist/articles/new')}>{ne ? 'नयाँ' : 'New'}</Link>
          <Link href={localizeHref(locale, '/journalist/tools')}>{ne ? 'उपकरण' : 'Tools'}</Link>
          <Link href={localizeHref(locale, '/journalist/feedback')}>{ne ? 'प्रतिक्रिया' : 'Feedback'}</Link>
        </header>
        {children}
      </div>
    </div>
  )
}
