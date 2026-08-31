'use client'

import { useCallback, useEffect, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { toDevanagari } from '@/lib/news/patro'
import { useMe } from '@/lib/news/auth-store'
import { apiGet, apiPost } from '@/lib/news/api-client'

/**
 * Article comments (प्रतिक्रिया) — server-backed, reader accounts only.
 * Comments appear instantly; editors can hide them from the सम्पादक desk.
 */

interface CommentItem {
  id: string
  authorName: string
  body: string
  createdAt: string
}

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${toDevanagari(mins)} मिनेट अघि`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${toDevanagari(hours)} घण्टा अघि`
  return `${toDevanagari(Math.round(hours / 24))} दिन अघि`
}

export function openAccountSheet() {
  window.dispatchEvent(new Event('nagarikwatch:open-account'))
}

export default function CommentsSection({ storyKey }: { storyKey: string }) {
  const { me } = useMe()
  const [comments, setComments] = useState<CommentItem[] | null>(null)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const load = useCallback(async () => {
    try {
      const json = await apiGet<{ comments: CommentItem[] }>(
        `/api/comments?key=${encodeURIComponent(storyKey)}`,
      )
      setComments(json.comments)
    } catch {
      setComments([])
    }
  }, [storyKey])

  useEffect(() => {
    const t = window.setTimeout(load, 0)
    return () => window.clearTimeout(t)
  }, [load])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || busy) return
    setBusy(true)
    setError(null)
    setOk(false)
    try {
      const json = await apiPost<{ comment: CommentItem }>('/api/comments', {
        key: storyKey,
        body: body.trim(),
      })
      setComments((prev) => [json.comment, ...(prev ?? [])])
      setBody('')
      setOk(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'प्रतिक्रिया पठाउन सकिएन।')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="border-t border-rule py-8 no-print" aria-label="प्रतिक्रियाहरू">
      <div className="article-measure px-4">
        <h2 className="flex items-center gap-2 font-headline text-[20px] font-extrabold text-ink">
          <MessageCircle className="size-5 text-crimson" />
          प्रतिक्रियाहरू
          {comments !== null && comments.length > 0 && (
            <span className="rounded-sm bg-crimson-wash px-2 py-0.5 font-headline text-[13px] font-bold text-crimson">
              {toDevanagari(comments.length)}
            </span>
          )}
        </h2>

        {/* Composer */}
        {me?.kind === 'reader' ? (
          <form onSubmit={submit} className="mt-4">
            <label htmlFor="comment-body" className="sr-only">
              आफ्नो प्रतिक्रिया लेख्नुहोस्
            </label>
            <textarea
              id="comment-body"
              rows={3}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="सम्मानपूर्वक, समाचारको विषयसँग सम्बन्धित प्रतिक्रिया लेख्नुहोस्…"
              className="w-full resize-y rounded-sm border border-rule bg-paper px-3.5 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/15"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-ink-faint">
                {toDevanagari(body.length)}/{toDevanagari(1000)} अक्षर · {me.name} तर्फबाट
              </p>
              <button
                type="submit"
                disabled={busy || body.trim().length < 3}
                className="flex items-center gap-2 rounded-sm bg-crimson px-4 py-2 font-headline text-[14px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
              >
                <Send className="size-3.5" />
                {busy ? 'पठाँदै…' : 'प्रतिक्रिया पठाउनुहोस्'}
              </button>
            </div>
            {ok && (
              <p className="mt-2 rounded-sm bg-market-green/10 px-3 py-2 text-[13px] font-medium text-market-green">
                प्रतिक्रिया प्रकाशित भयो — धन्यवाद!
              </p>
            )}
            {error && (
              <p className="mt-2 rounded-sm bg-crimson-wash px-3 py-2 text-[13px] font-medium text-crimson-deep">
                {error}
              </p>
            )}
          </form>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-dashed border-rule bg-surface-soft px-4 py-3.5">
            <p className="text-[14px] text-ink-soft">
              प्रतिक्रिया लेख्न पाठक खाता चाहिन्छ — खाता बनाउनुहोस् वा लगइन गर्नुहोस्।
            </p>
            <button
              type="button"
              onClick={openAccountSheet}
              className="rounded-sm bg-crimson px-4 py-2 font-headline text-[14px] font-bold text-white transition-colors hover:bg-crimson-deep"
            >
              पाठक लगइन
            </button>
          </div>
        )}

        {/* List */}
        {comments === null ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <div className="h-16 animate-pulse rounded-sm bg-rule/25" />
            <div className="h-16 animate-pulse rounded-sm bg-rule/25" />
          </div>
        ) : comments.length === 0 ? (
          <p className="mt-6 rounded-sm border border-dashed border-rule px-4 py-5 text-center text-[14px] text-ink-faint">
            अझै कुनै प्रतिक्रिया छैन — पहिलो प्रतिक्रिया तपाईंको हुन सक्छ।
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="paper-card rounded-sm p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-headline text-[15px] font-bold text-ink">
                    {c.authorName}
                  </p>
                  <p className="text-[11.5px] text-ink-faint">{timeAgo(c.createdAt)}</p>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-soft">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-[12px] leading-relaxed text-ink-faint">
          नागरिक वाचमा प्रतिक्रिया सम्मानजनक र विषयसँग सम्बन्धित हुनुपर्छ। अपमानजनक वा द्वेषपूर्ण
          सामग्री सम्पादकीय निर्णयले हटाइनेछ।
        </p>
      </div>
    </section>
  )
}
