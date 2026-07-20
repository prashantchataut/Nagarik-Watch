'use client'

import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'
import { AdminButton, AdminInput } from '@/components/admin/primitives'

export type HeroMediaLibraryItem = {
  id: string
  url: string
  alt: string
  caption?: string
  credit?: string
}

type Props = {
  url: string
  alt: string
  caption: string
  credit: string
  library: HeroMediaLibraryItem[]
  onChange: (next: {
    url?: string
    alt?: string
    caption?: string
    credit?: string
  }) => void
}

/**
 * Thumbnail attach flow for the article desk: live preview, file upload (Blob),
 * library pick, or paste URL. Alt is required for accessibility before publish.
 */
export function HeroMediaField({ url, alt, caption, credit, library, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [localLibrary, setLocalLibrary] = useState(library)

  function pick(item: HeroMediaLibraryItem) {
    onChange({
      url: item.url,
      alt: item.alt || alt,
      caption: item.caption ?? caption,
      credit: item.credit ?? credit,
    })
    setPickerOpen(false)
    setUploadError(null)
  }

  function onFile(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    startTransition(() => {
      void (async () => {
        const body = new FormData()
        body.set('file', file)
        if (alt.trim()) body.set('alt', alt.trim())
        if (caption.trim()) body.set('caption', caption.trim())
        if (credit.trim()) body.set('credit', credit.trim())
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          credentials: 'include',
          body,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setUploadError(
            String(data?.error ?? 'अपलोड असफल। URL टाँस्न वा Blob कन्फिगर गर्नुहोस्।'),
          )
          return
        }
        const item = data as HeroMediaLibraryItem
        setLocalLibrary((prev) => [item, ...prev.filter((x) => x.id !== item.id)])
        pick(item)
      })()
    })
  }

  return (
    <div className="space-y-3 rounded-lg border border-rule bg-surface-raised p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-meta font-bold text-brand-strong" lang="ne">
          मुख्य तस्वीर
        </p>
        <p className="text-caption text-mute" lang="ne">
          पूर्वावलोकन · अपलोड · पुस्तकालय
        </p>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-rule bg-surface">
        {url ? (
          <Image
            src={url}
            alt={alt || 'Hero preview'}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-meta font-semibold text-ink" lang="ne">
              तस्वीर छैन
            </p>
            <p className="text-caption text-ink-soft" lang="ne">
              फाइल अपलोड गर्नुहोस्, पुस्तकालयबाट छान्नुहोस्, वा URL टाँस्नुहोस्।
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminButton
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          <span lang="ne">{pending ? 'अपलोड हुँदै…' : 'फाइल अपलोड'}</span>
        </AdminButton>
        <AdminButton
          type="button"
          variant="ghost"
          onClick={() => setPickerOpen((o) => !o)}
        >
          <span lang="ne">{pickerOpen ? 'पुस्तकालय बन्द' : 'पुस्तकालय'}</span>
        </AdminButton>
        {url ? (
          <AdminButton
            type="button"
            variant="ghost"
            onClick={() => onChange({ url: '', alt: '', caption: '', credit: '' })}
          >
            <span lang="ne">हटाउनुहोस्</span>
          </AdminButton>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      {uploadError ? (
        <p role="alert" className="text-caption font-semibold text-[var(--breaking)]" lang="ne">
          {uploadError}
        </p>
      ) : null}

      {pickerOpen ? (
        <div className="max-h-56 overflow-y-auto rounded-md border border-rule bg-surface p-2">
          {localLibrary.length === 0 ? (
            <p className="p-3 text-caption text-ink-soft" lang="ne">
              पुस्तकालय खाली छ। पहिले अपलोड गर्नुहोस् वा मिडिया पृष्ठमा URL थप्नुहोस्।
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {localLibrary.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick(item)}
                    className="group relative aspect-video w-full overflow-hidden rounded border border-rule bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    title={item.alt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <AdminInput
        label="फोटो URL"
        name="heroImageUrl"
        type="url"
        value={url}
        onChange={(e) => onChange({ url: e.target.value })}
        lang="en"
        placeholder="https://…"
        hint="अपलोड नभए सार्वजनिक छवि URL टाँस्न सकिन्छ।"
      />
      <AdminInput
        label="Alt पाठ (आवश्यक)"
        name="heroImageAlt"
        value={alt}
        onChange={(e) => onChange({ alt: e.target.value })}
        lang="ne"
        hint="दृष्टिविहीन पाठक र खोजका लागि छोटो वर्णन।"
      />
      <AdminInput
        label="क्याप्सन"
        name="heroCaption"
        value={caption}
        onChange={(e) => onChange({ caption: e.target.value })}
        lang="ne"
      />
      <AdminInput
        label="श्रेय"
        name="heroCredit"
        value={credit}
        onChange={(e) => onChange({ credit: e.target.value })}
        lang="ne"
        hint="फोटोको स्रोत/फोटोग्राफर।"
      />
    </div>
  )
}
