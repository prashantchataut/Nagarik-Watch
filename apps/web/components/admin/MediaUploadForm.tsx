'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminButton, AdminInput } from '@/components/admin/primitives'

/** Client upload control for /admin/media when Blob is configured. */
export function MediaUploadForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [alt, setAlt] = useState('')
  const [credit, setCredit] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Choose an image file first.')
      return
    }
    if (!alt.trim()) {
      setError('Alt text is required.')
      return
    }
    startTransition(() => {
      void (async () => {
        const body = new FormData()
        body.set('file', file)
        body.set('alt', alt.trim())
        if (credit.trim()) body.set('credit', credit.trim())
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          credentials: 'include',
          body,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(String(data?.error ?? 'Upload failed.'))
          return
        }
        setOk('Uploaded.')
        setAlt('')
        setCredit('')
        if (fileRef.current) fileRef.current.value = ''
        router.refresh()
      })()
    })
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-3 border-t border-rule pt-4">
      <p className="text-meta font-bold text-ink" lang="ne">
        फाइल अपलोड (Vercel Blob)
      </p>
      <label className="grid gap-1.5">
        <span className="text-meta font-semibold text-ink">Image file</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="text-meta file:mr-3 file:border file:border-rule file:bg-surface file:px-3 file:py-1.5 file:text-meta"
          required
        />
      </label>
      <AdminInput
        label="Alt text"
        name="alt"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        required
        lang="en"
      />
      <AdminInput
        label="Credit"
        name="credit"
        value={credit}
        onChange={(e) => setCredit(e.target.value)}
        lang="en"
      />
      {error ? (
        <p role="alert" className="text-caption font-semibold text-[var(--breaking)]">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="text-caption font-semibold text-ink-soft">
          {ok}
        </p>
      ) : null}
      <AdminButton type="submit" disabled={pending}>
        {pending ? 'Uploading…' : 'Upload to Blob'}
      </AdminButton>
    </form>
  )
}
