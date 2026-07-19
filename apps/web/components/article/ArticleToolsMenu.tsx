'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { BookmarkButton } from '@/components/reader/BookmarkButton'
import { FontSizeControl } from '@/components/article/FontSizeControl'
import { ShareBar } from '@/components/article/ShareBar'

type ArticleToolsMenuProps = {
  story: StoryCardData
  locale: Locale
  title: string
  shareUrl: string
  articleSlug: string
  articleCategory: string
  readingMode: boolean
  onReadingModeChange: (next: boolean) => void
  speechSupported: boolean
  speaking: boolean
  onToggleNarrator: () => void
}

/** Calm overflow menu for bookmark, text size, share, reader view, and listen. */
export function ArticleToolsMenu({
  story,
  locale,
  title,
  shareUrl,
  articleSlug,
  articleCategory,
  readingMode,
  onReadingModeChange,
  speechSupported,
  speaking,
  onToggleNarrator,
}: ArticleToolsMenuProps) {
  const dict = getDictionary(locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const modeLabel = readingMode
    ? en
      ? 'Exit reader view'
      : 'पढाइ दृश्य बन्द'
    : en
      ? 'Reader view'
      : 'पढाइ दृश्य'
  const listenLabel = speaking
    ? en
      ? 'Stop audio'
      : 'आवाज रोक्नुहोस्'
    : en
      ? 'Listen'
      : 'सुन्नुहोस्'

  return (
    <div ref={rootRef} className="article-tools-menu">
      <button
        type="button"
        className="article-tools-menu__trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        lang={lang}
      >
        {en ? 'Article tools' : 'समाचार उपकरण'}
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div id={menuId} className="article-tools-menu__panel" role="menu" lang={lang}>
          <div className="article-tools-menu__row" role="none">
            <BookmarkButton story={story} locale={locale} variant="pill" />
          </div>
          <div className="article-tools-menu__row" role="none">
            <span className="article-tools-menu__label">{dict.fontSizeLabel}</span>
            <FontSizeControl locale={locale} />
          </div>
          <div className="article-tools-menu__row article-tools-menu__row--share" role="none">
            <ShareBar
              url={shareUrl}
              title={title}
              locale={locale}
              articleSlug={articleSlug}
              articleCategory={articleCategory}
              className="flex-col items-start gap-2"
            />
          </div>
          <div className="article-tools-menu__row article-tools-menu__actions" role="none">
            <button
              type="button"
              role="menuitem"
              className="article-tools-menu__action"
              aria-pressed={readingMode}
              onClick={() => onReadingModeChange(!readingMode)}
            >
              {modeLabel}
            </button>
            <button
              type="button"
              role="menuitem"
              className="article-tools-menu__action"
              aria-pressed={speaking}
              disabled={!speechSupported}
              onClick={onToggleNarrator}
            >
              {listenLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
