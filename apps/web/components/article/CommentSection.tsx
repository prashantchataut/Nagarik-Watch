'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Locale } from '@nagarikwatch/db'

type Comment = {
  id: string
  authorName: string
  bodyNe: string
  createdAt: string
  status: string
}

/**
 * CommentSection — the article-page comment block. Fetches approved comments
 * on mount, shows a submit form, and optimistically prepends new comments
 * with a "pending moderation" note.
 *
 * Rate-limited server-side (5/min/IP). Comments are created in 'pending'
 * status; a moderator approves them in /admin/comments before they appear
 * publicly.
 */
export function CommentSection({
  articleSlug,
  articleCategory,
  locale,
  commentsEnabled,
}: {
  articleSlug: string
  articleCategory: string
  locale: Locale
  commentsEnabled: boolean
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const ne = locale === 'ne'

  useEffect(() => {
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`)
      .then((r) => r.json())
      .then((data: { comments?: Comment[] }) => {
        setComments(data.comments ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [articleSlug])

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = new FormData(e.currentTarget)
    const authorName = String(form.get('authorName') ?? '').trim()
    const bodyNe = String(form.get('bodyNe') ?? '').trim()
    if (!authorName || !bodyNe) {
      setError(ne ? 'नाम र टिप्पणी दुवै आवश्यक।' : 'Name and comment are required.')
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ articleSlug, articleCategory, authorName, bodyNe, locale }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data?.error ?? (ne ? 'त्रुटि भयो।' : 'Error.'))
          return
        }
        // Optimistic: show as pending until a moderator approves.
        setComments((c) => [
          {
            id: data.id,
            authorName,
            bodyNe,
            createdAt: new Date().toISOString(),
            status: 'pending',
          },
          ...c,
        ])
        ;(e.target as HTMLFormElement).reset()
      } catch {
        setError(ne ? 'नेटवर्क त्रुटि।' : 'Network error.')
      }
    })
  }

  if (!commentsEnabled) {
    return (
      <section className="mt-12 border-t border-rule pt-8" aria-label={ne ? 'टिप्पणी' : 'Comments'}>
        <p className="text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'यो समाचारमा टिप्पणी बन्द छ।' : 'Comments are closed for this article.'}
        </p>
      </section>
    )
  }

  return (
    <section className="mt-12 border-t border-rule pt-8" aria-label={ne ? 'टिप्पणी' : 'Comments'}>
      <h2 className="font-display text-h2 text-ink" lang={ne ? 'ne' : 'en'}>
        {ne ? 'टिप्पणी' : 'Comments'}
        {comments.length > 0 && (
          <span className="ml-2 text-meta font-normal text-mute">({comments.length})</span>
        )}
      </h2>

      {/* Submit form */}
      <form
        onSubmit={submit}
        className="mt-5 grid gap-3 rounded-lg border border-rule bg-surface-raised p-4"
      >
        <label className="grid gap-1 text-meta font-semibold text-ink">
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'नाम' : 'Name'}</span>
          <input
            name="authorName"
            type="text"
            required
            maxLength={80}
            disabled={pending}
            placeholder={ne ? 'तपाईंको नाम' : 'Your name'}
            className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1 text-meta font-semibold text-ink">
          <span lang={ne ? 'ne' : 'en'}>{ne ? 'टिप्पणी' : 'Comment'}</span>
          <textarea
            name="bodyNe"
            required
            maxLength={2000}
            rows={4}
            disabled={pending}
            placeholder={ne ? 'आफ्नो विचार लेख्नुहोस्…' : 'Share your thoughts…'}
            className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
          />
        </label>
        {error && (
          <p className="text-meta text-breaking" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-brand px-5 text-meta font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:cursor-not-allowed disabled:opacity-60"
          lang={ne ? 'ne' : 'en'}
        >
          {pending ? (ne ? 'पठाइँदै…' : 'Posting…') : ne ? 'टिप्पणी पठाउनुहोस्' : 'Post comment'}
        </button>
        <p className="text-caption text-mute" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'टिप्पणी सम्पादकीय स्वीकृतिपछि प्रकाशित हुनेछ।'
            : 'Comments are published after editorial approval.'}
        </p>
      </form>

      {/* Comment list */}
      {loading ? (
        <p className="mt-6 text-body text-mute" lang={ne ? 'ne' : 'en'}>
          {ne ? 'लोड हुँदै…' : 'Loading…'}
        </p>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'अहिलेसम्म कुनै टिप्पणी छैन। पहिलो बनाउनुहोस्।' : 'No comments yet. Be the first.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-lg border border-rule bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-ink" lang={ne ? 'ne' : 'en'}>
                  {c.authorName}
                </p>
                <time className="text-caption text-mute">
                  {new Date(c.createdAt).toLocaleString(ne ? 'ne-NP' : 'en-GB', { timeZone: 'Asia/Kathmandu' })}
                </time>
              </div>
              <p
                className="mt-2 text-body text-ink-soft whitespace-pre-wrap"
                lang={ne ? 'ne' : 'en'}
              >
                {c.bodyNe}
              </p>
              {c.status === 'pending' && (
                <p
                  className="mt-2 inline-block rounded-full bg-brand-tint px-2 py-0.5 text-caption font-semibold text-brand-strong"
                  lang={ne ? 'ne' : 'en'}
                >
                  {ne ? 'स्वीकृतिको प्रतीक्षा' : 'Awaiting approval'}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
