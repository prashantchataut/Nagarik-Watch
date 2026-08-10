'use client'

import { useId, useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { insertAtCursor, prefixLines, wrapTextSelection } from '@/lib/content/inline-marks'
import { MediaGalleryPicker, type GalleryMediaItem } from '@/components/newsroom/MediaGalleryPicker'

type Props = {
  locale: Locale
  id?: string
  name?: string
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  required?: boolean
  density?: 'comfortable' | 'compact'
  showHints?: boolean
  placeholder?: string
  className?: string
  wordCountLabel?: string
}

type Tool =
  | 'bold'
  | 'italic'
  | 'highlight'
  | 'link'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'list'
  | 'image'
  | 'embed'

/**
 * Shared shorthand body editor for journalist + admin desks.
 * Toolbar inserts the existing ArticleBlock shorthand — no second body format.
 */
export function StoryBodyEditor({
  locale,
  id,
  name,
  label,
  value,
  onChange,
  rows = 22,
  required = false,
  density = 'comfortable',
  showHints = true,
  placeholder,
  className,
  wordCountLabel,
}: Props) {
  const ne = locale === 'ne'
  const autoId = useId()
  const fieldId = id ?? `story-body-${autoId}`
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0
  const effectiveRows = density === 'compact' ? Math.max(12, rows - 6) : rows

  function applyTransform(
    transform: (
      current: string,
      start: number,
      end: number,
    ) => {
      next: string
      selectionStart: number
      selectionEnd: number
    },
  ) {
    const el = textareaRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const result = transform(value, start, end)
    onChange(result.next)
    window.requestAnimationFrame(() => {
      const node = textareaRef.current
      if (!node) return
      node.focus()
      node.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function runTool(tool: Tool) {
    switch (tool) {
      case 'bold':
        applyTransform((current, start, end) =>
          wrapTextSelection(current, start, end, '**', '**', ne ? 'मोटो पाठ' : 'bold text'),
        )
        return
      case 'italic':
        applyTransform((current, start, end) =>
          wrapTextSelection(current, start, end, '*', '*', ne ? 'तिर्खा पाठ' : 'italic text'),
        )
        return
      case 'highlight':
        applyTransform((current, start, end) =>
          wrapTextSelection(current, start, end, '==', '==', ne ? 'महत्त्वपूर्ण' : 'highlight'),
        )
        return
      case 'link': {
        const href = window.prompt(ne ? 'लिंक URL (https://…)' : 'Link URL (https://…)', 'https://')
        if (!href || !/^https?:\/\//i.test(href.trim())) {
          setStatus(ne ? 'मान्य http(s) URL आवश्यक छ।' : 'A valid http(s) URL is required.')
          return
        }
        const safe = href.trim()
        applyTransform((current, start, end) =>
          wrapTextSelection(current, start, end, '[', `](${safe})`, ne ? 'लिंक पाठ' : 'link text'),
        )
        setStatus(null)
        return
      }
      case 'h2':
        applyTransform((current, start, end) => prefixLines(current, start, end, '## '))
        return
      case 'h3':
        applyTransform((current, start, end) => prefixLines(current, start, end, '### '))
        return
      case 'quote':
        applyTransform((current, start, end) => prefixLines(current, start, end, '> '))
        return
      case 'list':
        applyTransform((current, start, end) => prefixLines(current, start, end, '- '))
        return
      case 'image':
        setGalleryOpen(true)
        return
      case 'embed': {
        const url = window.prompt(
          ne ? 'YouTube वा अन्य embed URL' : 'YouTube or other embed URL',
          'https://',
        )
        if (!url || !/^https?:\/\//i.test(url.trim())) {
          setStatus(ne ? 'मान्य embed URL आवश्यक छ।' : 'A valid embed URL is required.')
          return
        }
        const trimmed = url.trim()
        const provider = /youtu(\.be|be\.com)/i.test(trimmed)
          ? 'youtube'
          : /twitter\.com|x\.com/i.test(trimmed)
            ? 'twitter'
            : /facebook\.com/i.test(trimmed)
              ? 'facebook'
              : 'custom'
        applyTransform((current, start, end) =>
          insertAtCursor(current, start, end, `[embed:${provider}](${trimmed})`),
        )
        setStatus(null)
        return
      }
      default: {
        const _exhaustive: never = tool
        void _exhaustive
      }
    }
  }

  function onPickMedia(item: GalleryMediaItem) {
    const alt = item.alt || (ne ? 'छवि' : 'image')
    const caption = item.caption ? ` "${item.caption.replace(/"/g, '')}"` : ''
    applyTransform((current, start, end) =>
      insertAtCursor(current, start, end, `![${alt}](${item.url}${caption})`),
    )
  }

  const tools: Array<{ id: Tool; label: string; title: string }> = [
    { id: 'bold', label: 'B', title: ne ? 'मोटो' : 'Bold' },
    { id: 'italic', label: 'I', title: ne ? 'तिर्खा' : 'Italic' },
    { id: 'highlight', label: 'H', title: ne ? 'हाइलाइट' : 'Highlight' },
    { id: 'link', label: '🔗', title: ne ? 'लिंक' : 'Link' },
    { id: 'h2', label: 'H2', title: ne ? 'उपशीर्षक' : 'Subhead' },
    { id: 'h3', label: 'H3', title: ne ? 'सानो शीर्षक' : 'Small head' },
    { id: 'quote', label: '❝', title: ne ? 'उद्धरण' : 'Quote' },
    { id: 'list', label: '•', title: ne ? 'सूची' : 'List' },
    { id: 'image', label: '🖼', title: ne ? 'छवि' : 'Image' },
    { id: 'embed', label: '▶', title: ne ? 'एम्बेड' : 'Embed' },
  ]

  return (
    <div className={`story-body-editor ${className ?? ''}`.trim()} data-density={density}>
      <div className="story-body-editor__label-row">
        <label htmlFor={fieldId}>
          {label}
          {required ? <span className="text-brand"> *</span> : null}
        </label>
        <span className="story-body-editor__meta">
          {wordCountLabel ?? (ne ? `${wordCount} शब्द` : `${wordCount} words`)}
        </span>
      </div>

      <div
        className="story-body-editor__toolbar"
        role="toolbar"
        aria-label={ne ? 'ढाँचा उपकरण' : 'Formatting tools'}
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={tool.title}
            aria-label={tool.title}
            data-tool={tool.id}
            onClick={() => runTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        id={fieldId}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={effectiveRows}
        required={required}
        aria-required={required || undefined}
        lang={ne ? 'ne' : 'en'}
        placeholder={
          placeholder ??
          (ne
            ? 'अनुच्छेद छुट्याउन खाली लाइन। ## उपशीर्षक, > उद्धरण, - सूची, **मोटो**, *तिर्खा*, ==हाइलाइट==, [पाठ](https://…)'
            : 'Blank lines between paragraphs. ## subhead, > quote, - list, **bold**, *italic*, ==highlight==, [text](https://…)')
        }
        className="story-body-editor__textarea"
      />

      {showHints ? (
        <p className="story-body-editor__hints">
          {ne
            ? 'टूलबारले विद्यमान shorthand मात्र घुसाउँछ। सार्वजनिक पृष्ठमा HTML होइन, सुरक्षित चिन्ह रेन्डर हुन्छ।'
            : 'The toolbar only inserts existing shorthand. Public pages render safe marks, not HTML.'}
        </p>
      ) : null}

      {status ? (
        <p className="story-body-editor__status" role="status">
          {status}
        </p>
      ) : null}

      <MediaGalleryPicker
        locale={locale}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onPick={onPickMedia}
        title={ne ? 'शरीरमा छवि घुसाउनुहोस्' : 'Insert image into body'}
      />
    </div>
  )
}
