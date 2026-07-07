'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

const ACTIONS: { status: CommentStatus; label: string; variant: string }[] = [
  { status: 'approved', label: 'स्वीकृत', variant: 'bg-up text-surface' },
  { status: 'rejected', label: 'अस्वीकृत', variant: 'border border-breaking/40 text-breaking' },
  { status: 'flagged', label: 'फ्ल्याग', variant: 'border border-rule text-ink-soft' },
]

export function CommentModerationActions({ commentId }: { commentId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function setStatus(status: CommentStatus) {
    setError('')
    startTransition(() => {
      void (async () => {
        const res = await fetch(`/api/admin/comments/${commentId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(String(body.error ?? 'कारबाही गर्न सकिएन'))
          return
        }
        router.refresh()
      })()
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => setStatus(action.status)}
            disabled={pending}
            className={`rounded-full px-3 py-1 text-caption font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${action.variant}`}
            lang="ne"
          >
            {action.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-caption text-breaking" lang="ne">{error}</p> : null}
    </div>
  )
}
