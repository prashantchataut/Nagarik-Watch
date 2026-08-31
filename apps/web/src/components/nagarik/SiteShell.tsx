'use client'

/**
 * SiteShell — the two-band chrome wrapped around every real route.
 * Mirrors the sandbox Portal: breaking banner, masthead, desk rail, footer,
 * mobile bottom nav, search overlay, menu sheet, account sheet, consent bar.
 * Route-aware via usePathname; go() events become Next router pushes.
 */

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { routeFromPathname } from '@/lib/news/router'
import { useTheme } from '@/lib/news/theme'
import { logout } from '@/lib/news/auth-store'
import { go } from '@/lib/news/router'
import BreakingBanner from './BreakingBanner'
import Masthead, { MenuSheet, MobileTopFacts } from './Masthead'
import DeskRail from './DeskRail'
import BottomNav from './BottomNav'
import { Footer } from './LegalView'
import { SearchOverlay } from './SavedSearch'
import AccountSheet from './AccountSheet'
import { CookieConsent } from './monetize'

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const route = routeFromPathname(pathname)
  const [theme, toggleTheme] = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  // Programmatic navigation events (go()) → Next router push.
  useEffect(() => {
    const navigate = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (detail) router.push(detail)
    }
    window.addEventListener('nagarikwatch:navigate', navigate)
    return () => window.removeEventListener('nagarikwatch:navigate', navigate)
  }, [router])

  // In-page '#account' anchors open the account sheet.
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === '#account') {
        setAccountOpen(true)
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    }
    onHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Article comments can request the reader account sheet
  useEffect(() => {
    const open = () => setAccountOpen(true)
    window.addEventListener('nagarikwatch:open-account', open)
    return () => window.removeEventListener('nagarikwatch:open-account', open)
  }, [])

  // Keyboard shortcut: "/" opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Language attribute follows the surface.
  useEffect(() => {
    document.documentElement.lang = route.name === 'english' ? 'en' : 'ne'
  }, [route.name])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }
  void handleLogout

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <BreakingBanner />
      <Masthead
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />
      <MobileTopFacts />
      <DeskRail route={route} />

      {children}

      <Footer />

      {/* Mobile bottom-nav spacer */}
      <div className="h-[64px] md:hidden" aria-hidden="true" />
      <BottomNav route={route} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
      <CookieConsent />
      <BackToTop />
    </div>
  )
}

export { go }

/* ---------------------------- back-to-top -------------------------------- */

function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 1200)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!show) return null
  return (
    <button
      type="button"
      aria-label="माथि फर्कनुहोस्"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 left-4 z-50 grid size-11 place-items-center rounded-full border border-rule bg-paper text-ink shadow-md transition-colors hover:border-crimson hover:text-crimson md:bottom-6 md:left-auto md:right-6"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
