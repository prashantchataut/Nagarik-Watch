'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AdminButton } from '@/components/admin/primitives'

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

const ACTIONS: { status: CommentStatus; label: string; variant: 'primary' | 'danger' | 'ghost' }[] =
  [
    { status: 'approved', label: 'स्वीकृत', variant: 'primary' },
    { status: 'rejected', label: 'अस्वीकृत', variant: 'danger' },
    { status: 'flagged', label: 'फ्ल्याग', variant: 'ghost' },
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
          <AdminButton
            key={action.status}
            type="button"
            onClick={() => setStatus(action.status)}
            disabled={pending}
            variant={action.variant}
            className="!min-h-8 !px-2 !text-caption"
          >
            <span lang="ne">{action.label}</span>
          </AdminButton>
        ))}
      </div>
      {error ? (
        <p className="text-caption text-breaking" lang="ne">
          {error}
        </p>
      ) : null}
    </div>
  )
}
