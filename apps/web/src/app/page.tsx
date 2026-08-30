'use client'

import { useEffect, useState } from 'react'
import { useRoute } from '@/lib/news/router'
import { findStory } from '@/lib/news/utils'
import { useTheme } from '@/lib/news/theme'
import Masthead, { MenuSheet, MobileTopFacts } from '@/components/nagarik/Masthead'
import DeskRail from '@/components/nagarik/DeskRail'
import BottomNav from '@/components/nagarik/BottomNav'
import HomeEdition from '@/components/nagarik/HomeEdition'
import EnglishHome from '@/components/nagarik/EnglishHome'
import ArticleView, { ArticleNotFound } from '@/components/nagarik/ArticleView'
import DeskPage from '@/components/nagarik/DeskPage'
import PatroView from '@/components/nagarik/PatroView'
import NepseView from '@/components/nagarik/NepseView'
import RashifalView from '@/components/nagarik/RashifalView'
import ScoresView from '@/components/nagarik/ScoresView'
import JournalistView from '@/components/nagarik/JournalistView'
import AccountSheet from '@/components/nagarik/AccountSheet'
import { DateConverterTool, PreetiTool, ToolsHub } from '@/components/nagarik/ToolsView'
import { SavedView, SearchOverlay, SearchView } from '@/components/nagarik/SavedSearch'
import { ProvinceHub, ProvincePage } from '@/components/nagarik/ProvinceView'
import LegalView, { Footer } from '@/components/nagarik/LegalView'

type Theme = 'light' | 'dark'

function View({ route }: { route: ReturnType<typeof useRoute> }) {
  switch (route.name) {
    case 'home':
      return <HomeEdition />
    case 'english':
      return <EnglishHome />
    case 'desk':
      return <DeskPage desk={route.desk} />
    case 'article': {
      const story = findStory(route.desk, route.slug)
      return story ? <ArticleView story={story} /> : <ArticleNotFound desk={route.desk} />
    }
    case 'province':
      return route.slug ? <ProvincePage slug={route.slug} /> : <ProvinceHub />
    case 'patro':
      return <PatroView />
    case 'nepse':
      return <NepseView />
    case 'rashifal':
      return <RashifalView />
    case 'scores':
      return <ScoresView />
    case 'tools':
      return <ToolsHub />
    case 'preeti':
      return <PreetiTool />
    case 'date-converter':
      return <DateConverterTool />
    case 'saved':
      return <SavedView />
    case 'journalist':
      return <JournalistView />
    case 'search':
      return <SearchView initialQuery={route.query ? decodeURIComponent(route.query) : ''} />
    case 'page':
      return <LegalView slug={route.slug} />
    default:
      return <HomeEdition />
  }
}

export default function Portal() {
  const route = useRoute()
  const [theme, toggleTheme] = useTheme()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

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

  useEffect(() => {
    document.documentElement.lang = route.name === 'english' ? 'en' : 'ne'
  }, [route.name])

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Masthead
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
      />
      <MobileTopFacts />
      <DeskRail route={route} />

      <View route={route} />

      <Footer />

      {/* Mobile bottom-nav spacer */}
      <div className="h-[64px] md:hidden" aria-hidden="true" />
      <BottomNav route={route} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  )
}
