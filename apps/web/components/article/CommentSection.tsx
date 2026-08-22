'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { hasLivePublicApi } from '@/lib/runtime/public-api'
import { TurnstileField } from '@/components/forms/TurnstileField'
import { localizeHref } from '@/lib/i18n/locales'

type Comment = {
  id: string
  authorName: string
  bodyNe: string
  parentId?: string
  createdAt: string
  status: string
  canDelete?: boolean
  upvoteCount?: number
}

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
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [signedIn, setSignedIn] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const ne = locale === 'ne'
  const lang = ne ? 'ne' : 'en'

  useEffect(() => {
    if (!commentsEnabled) {
      setLoading(false)
      return
    }
    if (!hasLivePublicApi()) {
      setLoading(false)
      setError(
        ne
          ? 'टिप्पणी यस स्थिर होस्टमा उपलब्ध छैन।'
          : 'Comments are not available on this static host.',
      )
      return
    }

    let stopped = false
    let inFlight = false
    let etag = ''
    const controller = new AbortController()
    const endpoint = `/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&articleCategory=${encodeURIComponent(articleCategory)}`

    async function loadComments(initial: boolean) {
      if (stopped || inFlight || (!initial && document.visibilityState === 'hidden')) return
      inFlight = true
      try {
        const response = await fetch(endpoint, {
          cache: 'no-cache',
          headers: etag ? { 'if-none-match': etag } : undefined,
          signal: controller.signal,
        })
        if (response.status === 304) return
        if (!response.ok) throw new Error(`Comment request failed: ${response.status}`)
        etag = response.headers.get('etag') ?? etag
        const data = (await response.json()) as {
          comments?: Comment[]
          signedIn?: boolean
          displayName?: string | null
        }
        if (stopped) return
        const incoming = data.comments ?? []
        setComments((current) => {
          const incomingIds = new Set(incoming.map((comment) => comment.id))
          const localPending = current.filter(
            (comment) => comment.status === 'pending' && !incomingIds.has(comment.id),
          )
          return [...incoming, ...localPending]
        })
        setSignedIn(Boolean(data.signedIn))
        setDisplayName(data.displayName ?? null)
        if (initial) setError(null)
      } catch (loadError) {
        if (stopped || controller.signal.aborted) return
        if (initial) {
          setError(ne ? 'टिप्पणी लोड गर्न सकिएन।' : 'Comments could not be loaded.')
        } else {
          console.warn(
            '[comments] refresh failed',
            loadError instanceof Error ? loadError.message : loadError,
          )
        }
      } finally {
        inFlight = false
        if (initial && !stopped) setLoading(false)
      }
    }

    void loadComments(true)
    const interval = window.setInterval(() => void loadComments(false), 15_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void loadComments(false)
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      stopped = true
      controller.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [articleCategory, articleSlug, commentsEnabled, ne])

  const roots = useMemo(() => comments.filter((comment) => !comment.parentId), [comments])
  const approvedCount = useMemo(
    () => comments.filter((comment) => comment.status === 'approved').length,
    [comments],
  )
  const replies = useMemo(() => {
    const map = new Map<string, Comment[]>()
    for (const comment of comments) {
      if (!comment.parentId) continue
      map.set(comment.parentId, [...(map.get(comment.parentId) ?? []), comment])
    }
    return map
  }, [comments])

  function chooseReply(comment: Comment) {
    setReplyTo(comment)
    setComposerOpen(true)
    queueMicrotask(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!hasLivePublicApi()) {
      setError(
        ne
          ? 'टिप्पणी यस स्थिर होस्टमा उपलब्ध छैन।'
          : 'Comments are not available on this static host.',
      )
      return
    }
    const form = new FormData(event.currentTarget)
    const bodyNe = String(form.get('bodyNe') ?? '').trim()
    const turnstileToken = String(form.get('cf-turnstile-response') ?? '')
    if (!signedIn) {
      setError(ne ? 'टिप्पणी गर्न लगइन आवश्यक छ।' : 'Sign in is required to comment.')
      return
    }
    if (bodyNe.length < 3) {
      setError(
        ne ? 'कम्तीमा ३ अक्षरको टिप्पणी आवश्यक छ।' : 'Add a comment of at least 3 characters.',
      )
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            articleSlug,
            articleCategory,
            bodyNe,
            parentId: replyTo?.id,
            locale,
            turnstileToken,
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(
            String(data?.error ?? (ne ? 'टिप्पणी पठाउन सकिएन।' : 'Comment could not be posted.')),
          )
          return
        }
        setComments((current) => [
          ...current,
          {
            id: String(data.id),
            authorName: String(data.authorName ?? displayName ?? (ne ? 'पाठक' : 'Reader')),
            bodyNe,
            parentId: replyTo?.id,
            createdAt: new Date().toISOString(),
            status: 'pending',
            canDelete: Boolean(data.canDelete),
            upvoteCount: 0,
          },
        ])
        formRef.current?.reset()
        setReplyTo(null)
        setComposerOpen(false)
      } catch {
        setError(ne ? 'नेटवर्क त्रुटि। पुनः प्रयास गर्नुहोस्।' : 'Network error. Try again.')
      }
    })
  }

  function removeComment(id: string) {
    startTransition(async () => {
      const response = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (response.ok) {
        setComments((current) => current.filter((comment) => comment.id !== id))
        return
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      setError(
        response.status === 409
          ? ne
            ? 'प्रकाशित जवाफ भएको टिप्पणी हटाउन मिल्दैन।'
            : 'A comment with published replies cannot be deleted.'
          : String(body.error ?? (ne ? 'टिप्पणी हटाउन सकिएन।' : 'Comment could not be removed.')),
      )
    })
  }

  function vote(commentId: string) {
    startTransition(async () => {
      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ commentId }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        upvoteCount?: number
        error?: string
      }
      if (!response.ok) {
        setError(String(data.error ?? (ne ? 'भोट गर्न सकिएन।' : 'Could not record vote.')))
        return
      }
      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? { ...comment, upvoteCount: Number(data.upvoteCount ?? comment.upvoteCount ?? 0) }
            : comment,
        ),
      )
    })
  }

  if (!commentsEnabled) {
    return (
      <section className="comment-desk comment-desk--closed" lang={lang}>
        <p>{ne ? 'यो समाचारमा टिप्पणी बन्द छ।' : 'Comments are closed for this article.'}</p>
      </section>
    )
  }

  const renderComment = (comment: Comment, nested = false) => (
    <article
      key={comment.id}
      className="comment-item"
      data-nested={nested}
      data-pending={comment.status === 'pending'}
    >
      <header>
        <div>
          <strong>{comment.authorName}</strong>
          {comment.status === 'pending' ? <span>{ne ? 'समीक्षामा' : 'In moderation'}</span> : null}
        </div>
        <time dateTime={comment.createdAt}>
          {new Date(comment.createdAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}
        </time>
      </header>
      <p lang="ne">{comment.bodyNe}</p>
      <footer>
        {comment.status === 'approved' ? (
          <button type="button" onClick={() => vote(comment.id)} disabled={pending}>
            {ne ? `उपयोगी ${comment.upvoteCount ?? 0}` : `Helpful ${comment.upvoteCount ?? 0}`}
          </button>
        ) : null}
        {comment.status === 'approved' && !nested ? (
          <button type="button" onClick={() => chooseReply(comment)}>
            {ne ? 'जवाफ दिनुहोस्' : 'Reply'}
          </button>
        ) : null}
        {comment.canDelete ? (
          <button type="button" onClick={() => removeComment(comment.id)} disabled={pending}>
            {ne ? 'हटाउनुहोस्' : 'Delete'}
          </button>
        ) : null}
      </footer>
    </article>
  )

  return (
    <section className="comment-desk" aria-labelledby="comment-desk-title" lang={lang}>
      <header className="comment-desk__header">
        <div>
          <p className="editorial-kicker">{ne ? 'पाठक संवाद' : 'Reader conversation'}</p>
          <h2 id="comment-desk-title">
            {ne ? 'तथ्यमा आधारित संवाद' : 'A conversation grounded in the story'}
          </h2>
          <p>
            {ne
              ? 'असहमति स्वीकार्य छ; व्यक्तिगत आक्रमण, घृणा र अपुष्ट आरोप प्रकाशित हुँदैनन्।'
              : 'Disagreement is welcome; personal attacks, hate and unsupported allegations are not published.'}
          </p>
        </div>
        <span aria-label={ne ? 'स्वीकृत टिप्पणी' : 'Approved comments'}>{approvedCount}</span>
      </header>

      {loading ? (
        <p className="comment-desk__state">{ne ? 'टिप्पणी लोड हुँदै…' : 'Loading comments…'}</p>
      ) : roots.length === 0 ? (
        <div className="comment-desk__empty">
          <strong>{ne ? 'संवाद सुरु भएको छैन' : 'No comments yet'}</strong>
          <p>
            {ne
              ? 'समाचारको तथ्य, प्रभाव वा छुटेको सन्दर्भबारे पहिलो टिप्पणी गर्नुहोस्।'
              : 'Be the first to add context or respond to the reporting.'}
          </p>
        </div>
      ) : (
        <ol className="comment-thread">
          {roots.map((comment) => (
            <li key={comment.id}>
              {renderComment(comment)}
              {(replies.get(comment.id) ?? []).length ? (
                <ol>
                  {replies.get(comment.id)!.map((reply) => (
                    <li key={reply.id}>{renderComment(reply, true)}</li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {!composerOpen ? (
        <div className="mt-4">
          <button
            type="button"
            className="inline-flex min-h-11 items-center border border-rule bg-surface px-4 text-meta font-bold text-ink hover:border-brand hover:text-brand-strong"
            onClick={() => setComposerOpen(true)}
          >
            {ne ? 'टिप्पणी लेख्नुहोस्' : 'Write a comment'}
          </button>
        </div>
      ) : !signedIn ? (
        <div className="comment-composer">
          <p className="comment-composer__identity">
            {ne
              ? 'टिप्पणी पठाउन पाठक खातामा लगइन गर्नुहोस्।'
              : 'Sign in with a reader account to submit a comment.'}
          </p>
          <Link
            href={`${localizeHref(locale, '/auth/login')}?next=${encodeURIComponent(
              localizeHref(locale, `/${articleCategory}/${articleSlug}`),
            )}`}
          >
            {ne ? 'लगइन गर्नुहोस्' : 'Sign in'}
          </Link>
        </div>
      ) : (
        <form ref={formRef} onSubmit={submit} className="comment-composer">
          {replyTo ? (
            <div className="comment-composer__reply">
              <span>
                {ne ? `${replyTo.authorName} लाई जवाफ` : `Replying to ${replyTo.authorName}`}
              </span>
              <button type="button" onClick={() => setReplyTo(null)}>
                {ne ? 'रद्द' : 'Cancel'}
              </button>
            </div>
          ) : null}
          <p className="comment-composer__identity">
            {ne
              ? `${displayName ?? 'पाठक'} को रूपमा टिप्पणी गर्दै`
              : `Commenting as ${displayName ?? 'reader'}`}
          </p>
          <label>
            <span>
              {replyTo ? (ne ? 'जवाफ' : 'Reply') : ne ? 'तपाईंको टिप्पणी' : 'Your comment'}
            </span>
            <textarea
              name="bodyNe"
              required
              minLength={3}
              maxLength={2000}
              rows={5}
              disabled={pending}
              lang="ne"
              placeholder={
                ne
                  ? 'समाचारको विषयमै केन्द्रित भएर लेख्नुहोस्…'
                  : 'Write in Nepali when possible; stay specific to the reporting…'
              }
            />
          </label>
          <TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          <div className="comment-composer__footer">
            <p>
              {ne
                ? 'सम्पादकीय स्वीकृतिपछि सार्वजनिक हुन्छ।'
                : 'Published after editorial moderation.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setComposerOpen(false)} disabled={pending}>
                {ne ? 'बन्द' : 'Close'}
              </button>
              <button type="submit" disabled={pending}>
                {pending
                  ? ne
                    ? 'पठाइँदै…'
                    : 'Posting…'
                  : replyTo
                    ? ne
                      ? 'जवाफ पठाउनुहोस्'
                      : 'Post reply'
                    : ne
                      ? 'टिप्पणी पठाउनुहोस्'
                      : 'Post comment'}
              </button>
            </div>
          </div>
          {error ? (
            <p className="comment-composer__error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
      {error && !composerOpen ? (
        <p className="comment-composer__error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
