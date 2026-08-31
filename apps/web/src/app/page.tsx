'use client'

import { useEffect, useState } from 'react'
import { useRoute } from '@/lib/news/router'
import { findStory } from '@/lib/news/utils'
import { useTheme } from '@/lib/news/theme'
import { dbArticleToStory, useDbArticles } from '@/lib/news/article-store'
import BreakingBanner from '@/components/nagarik/BreakingBanner'
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

/** Resolve an article from the static archive OR the live CMS store. */
function ArticleRoute({ desk, slug }: { desk: string; slug: string }) {
  const story = findStory(desk, slug)
  const { dbArticles, ready } = useDbArticles()

  if (story) return <ArticleView story={story} />
  const dbMatch = dbArticles.find((a) => a.desk === desk && a.slug === slug)
  if (dbMatch) return <ArticleView story={dbArticleToStory(dbMatch)} />

  if (!ready) {
    return (
      <main id="main" aria-busy="true">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center gap-4 px-4 py-24">
          <div className="h-3 w-40 animate-pulse rounded-full bg-rule/60" />
          <div className="h-8 w-2/3 max-w-[520px] animate-pulse rounded bg-rule/40" />
          <div className="h-3 w-56 animate-pulse rounded-full bg-rule/30" />
        </div>
      </main>
    )
  }
  return <ArticleNotFound desk={desk} />
}

function View({ route }: { route: ReturnType<typeof useRoute> }) {
  switch (route.name) {
    case 'home':
      return <HomeEdition />
    case 'english':
      return <EnglishHome />
    case 'desk':
      return <DeskPage desk={route.desk} />
    case 'article':
      return <ArticleRoute desk={route.desk} slug={route.slug} />
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

  // Article comments can request the reader account sheet
  useEffect(() => {
    const open = () => setAccountOpen(true)
    window.addEventListener('nagarikwatch:open-account', open)
    return () => window.removeEventListener('nagarikwatch:open-account', open)
  }, [])

  useEffect(() => {
    document.documentElement.lang = route.name === 'english' ? 'en' : 'ne'
  }, [route.name])

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
