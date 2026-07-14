'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { Locale } from '@nagarikwatch/db'

type Comment = {
  id: string
  authorName: string
  bodyNe: string
  parentId?: string
  createdAt: string
  status: string
  canDelete?: boolean
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
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const ne = locale === 'ne'

  useEffect(() => {
    let cancelled = false
    fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&articleCategory=${encodeURIComponent(articleCategory)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Comment request failed: ${response.status}`)
        return response.json() as Promise<{ comments?: Comment[]; signedIn?: boolean; displayName?: string | null }>
      })
      .then((data) => {
        if (cancelled) return
        setComments(data.comments ?? [])
        setSignedIn(Boolean(data.signedIn))
        setDisplayName(data.displayName ?? null)
      })
      .catch(() => setError(ne ? 'टिप्पणी लोड गर्न सकिएन।' : 'Comments could not be loaded.'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [articleCategory, articleSlug, ne])

  const roots = useMemo(() => comments.filter((comment) => !comment.parentId), [comments])
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
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const authorName = String(form.get('authorName') ?? '').trim()
    const bodyNe = String(form.get('bodyNe') ?? '').trim()
    if ((!signedIn && !authorName) || bodyNe.length < 3) {
      setError(ne ? 'नाम र कम्तीमा ३ अक्षरको टिप्पणी आवश्यक छ।' : 'Add your name and a comment of at least 3 characters.')
      return
    }
    startTransition(async () => {
      try {
        const response = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ articleSlug, articleCategory, authorName, bodyNe, parentId: replyTo?.id, locale }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          setError(String(data?.error ?? (ne ? 'टिप्पणी पठाउन सकिएन।' : 'Comment could not be posted.')))
          return
        }
        setComments((current) => [...current, {
          id: String(data.id),
          authorName: String(data.authorName ?? displayName ?? authorName),
          bodyNe,
          parentId: replyTo?.id,
          createdAt: new Date().toISOString(),
          status: 'pending',
          canDelete: Boolean(data.canDelete),
        }])
        formRef.current?.reset()
        setReplyTo(null)
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
      const body = await response.json().catch(() => ({})) as { error?: string }
      setError(response.status === 409
        ? (ne ? 'प्रकाशित जवाफ भएको टिप्पणी हटाउन मिल्दैन।' : 'A comment with published replies cannot be deleted.')
        : String(body.error ?? (ne ? 'टिप्पणी हटाउन सकिएन।' : 'Comment could not be removed.')))
    })
  }

  if (!commentsEnabled) {
    return <section className="comment-desk comment-desk--closed"><p>{ne ? 'यो समाचारमा टिप्पणी बन्द छ।' : 'Comments are closed for this article.'}</p></section>
  }

  const renderComment = (comment: Comment, nested = false) => (
    <article key={comment.id} className="comment-item" data-nested={nested} data-pending={comment.status === 'pending'}>
      <header>
        <div><strong>{comment.authorName}</strong>{comment.status === 'pending' ? <span>{ne ? 'समीक्षामा' : 'In moderation'}</span> : null}</div>
        <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}</time>
      </header>
      <p>{comment.bodyNe}</p>
      <footer>
        {comment.status === 'approved' && !nested ? <button type="button" onClick={() => chooseReply(comment)}>{ne ? 'जवाफ दिनुहोस्' : 'Reply'}</button> : null}
        {comment.canDelete ? <button type="button" onClick={() => removeComment(comment.id)} disabled={pending}>{ne ? 'हटाउनुहोस्' : 'Delete'}</button> : null}
      </footer>
    </article>
  )

  return (
    <section className="comment-desk" aria-labelledby="comment-desk-title" lang={ne ? 'ne' : 'en'}>
      <header className="comment-desk__header">
        <div>
          <p className="editorial-kicker" lang="en">Reader conversation</p>
          <h2 id="comment-desk-title">{ne ? 'तथ्यमा आधारित संवाद' : 'A conversation grounded in the story'}</h2>
          <p>{ne ? 'असहमति स्वीकार्य छ; व्यक्तिगत आक्रमण, घृणा र अपुष्ट आरोप प्रकाशित हुँदैनन्।' : 'Disagreement is welcome; personal attacks, hate and unsupported allegations are not published.'}</p>
        </div>
        <span>{comments.length}</span>
      </header>

      <form ref={formRef} onSubmit={submit} className="comment-composer">
        {replyTo ? <div className="comment-composer__reply"><span>{ne ? `${replyTo.authorName} लाई जवाफ` : `Replying to ${replyTo.authorName}`}</span><button type="button" onClick={() => setReplyTo(null)}>{ne ? 'रद्द' : 'Cancel'}</button></div> : null}
        {!signedIn ? <label><span>{ne ? 'नाम' : 'Name'}</span><input name="authorName" required maxLength={80} disabled={pending} placeholder={ne ? 'तपाईंको सार्वजनिक नाम' : 'Your public name'} /></label> : <p className="comment-composer__identity">{ne ? `${displayName ?? 'पाठक'} को रूपमा टिप्पणी गर्दै` : `Commenting as ${displayName ?? 'reader'}`}</p>}
        <label><span>{replyTo ? (ne ? 'जवाफ' : 'Reply') : (ne ? 'तपाईंको टिप्पणी' : 'Your comment')}</span><textarea name="bodyNe" required minLength={3} maxLength={2000} rows={5} disabled={pending} placeholder={ne ? 'समाचारको विषयमै केन्द्रित भएर लेख्नुहोस्…' : 'Stay specific to the reporting…'} /></label>
        <div className="comment-composer__footer">
          <p>{ne ? 'सम्पादकीय स्वीकृतिपछि सार्वजनिक हुन्छ।' : 'Published after editorial moderation.'}</p>
          <button type="submit" disabled={pending}>{pending ? (ne ? 'पठाइँदै…' : 'Posting…') : replyTo ? (ne ? 'जवाफ पठाउनुहोस्' : 'Post reply') : (ne ? 'टिप्पणी पठाउनुहोस्' : 'Post comment')}</button>
        </div>
        {error ? <p className="comment-composer__error" role="alert">{error}</p> : null}
      </form>

      {loading ? <p className="comment-desk__state">{ne ? 'टिप्पणी लोड हुँदै…' : 'Loading comments…'}</p> : roots.length === 0 ? <div className="comment-desk__empty"><strong>{ne ? 'संवाद सुरु भएको छैन' : 'The conversation is open'}</strong><p>{ne ? 'समाचारको तथ्य, प्रभाव वा छुटेको सन्दर्भबारे पहिलो टिप्पणी गर्नुहोस्।' : 'Be the first to add context, question an implication, or respond to the reporting.'}</p></div> : <ol className="comment-thread">{roots.map((comment) => <li key={comment.id}>{renderComment(comment)}{(replies.get(comment.id) ?? []).length ? <ol>{replies.get(comment.id)!.map((reply) => <li key={reply.id}>{renderComment(reply, true)}</li>)}</ol> : null}</li>)}</ol>}
    </section>
  )
}
