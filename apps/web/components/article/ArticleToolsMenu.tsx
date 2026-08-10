'use client'

import { useEffect, useId, useState } from 'react'
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
  speechHint?: string | null
  onToggleNarrator: () => void
}

/** Always-visible article toolbar: bookmark, size, listen, reader view, share. */
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
  speechHint,
  onToggleNarrator,
}: ArticleToolsMenuProps) {
  const dict = getDictionary(locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const shareId = useId()
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (!shareOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShareOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [shareOpen])

  const modeLabel = readingMode
    ? en
      ? 'Exit reader view'
      : 'पढाइ दृश्य बन्द'
    : en
      ? 'Reader view'
      : 'पढाइ दृश्य'
  const listenLabel = speaking ? (en ? 'Stop' : 'रोक्नुहोस्') : en ? 'Listen' : 'सुन्नुहोस्'

  return (
    <div className="article-tools-bar" lang={lang}>
      <div className="article-tools-bar__primary">
        <BookmarkButton story={story} locale={locale} variant="pill" />
        <div className="article-tools-bar__group">
          <span className="article-tools-bar__label">{dict.fontSizeLabel}</span>
          <FontSizeControl locale={locale} />
        </div>
        <button
          type="button"
          className="article-tools-bar__btn"
          aria-pressed={readingMode}
          onClick={() => onReadingModeChange(!readingMode)}
        >
          {modeLabel}
        </button>
        <button
          type="button"
          className="article-tools-bar__btn"
          aria-pressed={speaking}
          disabled={!speechSupported}
          title={speechHint ?? undefined}
          onClick={onToggleNarrator}
        >
          {listenLabel}
        </button>
        <button
          type="button"
          className="article-tools-bar__btn"
          aria-expanded={shareOpen}
          aria-controls={shareId}
          onClick={() => setShareOpen((value) => !value)}
        >
          {en ? 'Share' : 'सेयर'}
        </button>
      </div>
      {speechHint && !speaking ? (
        <p className="article-tools-bar__hint" role="status">
          {speechHint}
        </p>
      ) : null}
      {shareOpen ? (
        <div id={shareId} className="article-tools-bar__share">
          <ShareBar
            url={shareUrl}
            title={title}
            locale={locale}
            articleSlug={articleSlug}
            articleCategory={articleCategory}
            className="flex-wrap gap-2"
          />
        </div>
      ) : null}
    </div>
  )
}
