'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AdminButton } from '@/components/admin/primitives'

type SubmissionStatus = 'new' | 'in_review' | 'accepted' | 'rejected'

const ACTIONS: { status: SubmissionStatus; label: string; variant: 'primary' | 'secondary' | 'danger' }[] = [
  { status: 'in_review', label: 'Review', variant: 'secondary' },
  { status: 'accepted', label: 'Accept', variant: 'primary' },
  { status: 'rejected', label: 'Reject', variant: 'danger' },
]

export function SubmissionModerationActions({ id }: { id: string }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function update(status: SubmissionStatus) {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/admin/submissions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, editorNote: note }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(String(body?.error ?? 'अपडेट गर्न सकिएन।'))
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="grid min-w-[15rem] gap-2">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="सम्पादकीय नोट"
        className="min-h-16 rounded-md border border-rule bg-surface px-2.5 py-2 text-caption text-ink"
      />
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((action) => (
          <AdminButton
            key={action.status}
            type="button"
            disabled={pending}
            onClick={() => update(action.status)}
            variant={action.variant}
            className="!min-h-8 !px-2.5 !py-1 !text-caption"
          >
            {action.label}
          </AdminButton>
        ))}
      </div>
      {error ? <p className="text-caption text-breaking">{error}</p> : null}
    </div>
  )
}
