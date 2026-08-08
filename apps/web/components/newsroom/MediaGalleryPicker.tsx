'use client'

import Image from 'next/image'
import { useEffect, useState, useTransition } from 'react'
import type { Locale } from '@nagarikwatch/db'

export type GalleryMediaItem = {
  id: string
  url: string
  alt: string
  caption?: string
  credit?: string
}

type Props = {
  locale: Locale
  open: boolean
  onClose: () => void
  onPick: (item: GalleryMediaItem) => void
  title?: string
  allowUpload?: boolean
}

/**
 * In-desk media gallery: lists soft-desk library items and optional upload.
 * When Payload is canonical, surfaces the CMS URL instead of a fake empty grid.
 */
export function MediaGalleryPicker({
  locale,
  open,
  onClose,
  onPick,
  title,
  allowUpload = true,
}: Props) {
  const ne = locale === 'ne'
  const [items, setItems] = useState<GalleryMediaItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cmsUrl, setCmsUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [alt, setAlt] = useState('')

  useEffect(() => {
    if (!open) return
    setError(null)
    setCmsUrl(null)
    startTransition(() => {
      void (async () => {
        const res = await fetch('/api/admin/media', { credentials: 'include' })
        const data = (await res.json().catch(() => ({}))) as {
          items?: GalleryMediaItem[]
          error?: string
          cmsUrl?: string
        }
        if (res.status === 409 && data.cmsUrl) {
          setCmsUrl(data.cmsUrl)
          setItems([])
          setError(
            data.error ??
              (ne
                ? 'प्रोडक्सन मिडिया Payload मा व्यवस्थापन हुन्छ।'
                : 'Production media is managed in Payload CMS.'),
          )
          return
        }
        if (!res.ok) {
          setError(data.error ?? (ne ? 'मिडिया लोड गर्न सकिएन।' : 'Could not load media.'))
          return
        }
        setItems(Array.isArray(data.items) ? data.items : [])
      })()
    })
  }, [ne, open])

  if (!open) return null

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      item.alt.toLowerCase().includes(q) ||
      (item.caption ?? '').toLowerCase().includes(q) ||
      (item.credit ?? '').toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q)
    )
  })

  function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    startTransition(() => {
      void (async () => {
        const body = new FormData()
        body.set('file', file)
        if (alt.trim()) body.set('alt', alt.trim())
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          credentials: 'include',
          body,
        })
        const data = (await res.json().catch(() => ({}))) as GalleryMediaItem & {
          error?: string
          cmsUrl?: string
        }
        if (res.status === 409 && data.cmsUrl) {
          setCmsUrl(data.cmsUrl)
          setError(data.error ?? 'Payload CMS')
          return
        }
        if (!res.ok) {
          setError(data.error ?? (ne ? 'अपलोड असफल।' : 'Upload failed.'))
          return
        }
        const item: GalleryMediaItem = {
          id: data.id || `upload_${Date.now()}`,
          url: data.url,
          alt: data.alt || alt || file.name,
          caption: data.caption,
          credit: data.credit,
        }
        setItems((current) => [item, ...current])
        onPick(item)
        onClose()
      })()
    })
  }

  return (
    <div className="media-gallery-picker" role="dialog" aria-modal="true" aria-label={title ?? (ne ? 'मिडिया ग्यालरी' : 'Media gallery')}>
      <button type="button" className="media-gallery-picker__backdrop" aria-label={ne ? 'बन्द गर्नुहोस्' : 'Close'} onClick={onClose} />
      <div className="media-gallery-picker__panel">
        <header className="media-gallery-picker__header">
          <div>
            <h2>{title ?? (ne ? 'मिडिया ग्यालरी' : 'Media gallery')}</h2>
            <p>{ne ? 'शरीरमा छवि घुसाउन वा हिरोका लागि छान्नुहोस्।' : 'Pick an image for the body or hero.'}</p>
          </div>
          <button type="button" onClick={onClose}>{ne ? 'बन्द' : 'Close'}</button>
        </header>

        <div className="media-gallery-picker__toolbar">
          <label>
            <span className="sr-only">{ne ? 'खोज' : 'Search'}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ne ? 'alt, क्याप्शन, URL…' : 'alt, caption, URL…'}
            />
          </label>
          {allowUpload && !cmsUrl ? (
            <label className="media-gallery-picker__upload">
              <span>{ne ? 'अपलोड' : 'Upload'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={pending}
                onChange={(event) => onFile(event.target.files?.[0])}
              />
            </label>
          ) : null}
        </div>

        {allowUpload && !cmsUrl ? (
          <label className="media-gallery-picker__alt">
            <span>{ne ? 'अपलोड alt (वैकल्पिक)' : 'Upload alt (optional)'}</span>
            <input value={alt} onChange={(event) => setAlt(event.target.value)} lang="ne" />
          </label>
        ) : null}

        {error ? (
          <p className="media-gallery-picker__error" role="status">
            {error}
            {cmsUrl ? (
              <>
                {' '}
                <a href={cmsUrl} target="_blank" rel="noopener noreferrer">
                  {ne ? 'Payload खोल्नुहोस्' : 'Open Payload'}
                </a>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="media-gallery-picker__grid" aria-busy={pending}>
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="media-gallery-picker__card"
              onClick={() => {
                onPick(item)
                onClose()
              }}
            >
              <span className="media-gallery-picker__thumb">
                <Image src={item.url} alt="" fill className="object-cover" unoptimized={item.url.startsWith('data:')} />
              </span>
              <span className="media-gallery-picker__meta">
                <strong>{item.alt || (ne ? 'शीर्षकविहीन' : 'Untitled')}</strong>
                {item.credit ? <span>{item.credit}</span> : null}
              </span>
            </button>
          ))}
          {!pending && filtered.length === 0 && !error ? (
            <p className="media-gallery-picker__empty">
              {ne ? 'पुस्तकालय खाली छ। URL दर्ता वा अपलोड गर्नुहोस्।' : 'Library is empty. Register a URL or upload.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
