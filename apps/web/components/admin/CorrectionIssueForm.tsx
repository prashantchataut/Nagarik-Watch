'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { AdminButton, AdminSelect, AdminTextarea } from '@/components/admin/primitives'
import type { CorrectionSeverity } from '@nagarikwatch/db'

export type CorrectionArticleOption = {
  id: string
  label: string
}

const SEVERITY_OPTIONS: { value: CorrectionSeverity; label: string }[] = [
  { value: 'retraction', label: 'खारेजी / फिर्ता' },
  { value: 'factual', label: 'तथ्य गलत' },
  { value: 'attribution', label: 'श्रेय / स्रोत' },
  { value: 'clarification', label: 'स्पष्टीकरण' },
  { value: 'typo', label: 'हिज्जे' },
]

/**
 * Issues a correction against one article. The article select defaults to
 * whatever the urgency scorer matched, but stays editable — the matcher is
 * deliberately conservative and an editor who knows the story should not have
 * to argue with it.
 */
export function CorrectionIssueForm({
  requestId,
  articles,
  defaultArticleId,
  defaultSeverity,
}: {
  requestId?: string
  articles: CorrectionArticleOption[]
  defaultArticleId?: string
  defaultSeverity: CorrectionSeverity
}) {
  const router = useRouter()
  const [articleId, setArticleId] = useState(defaultArticleId ?? articles[0]?.id ?? '')
  const [severity, setSeverity] = useState<CorrectionSeverity>(defaultSeverity)
  const [summaryNe, setSummaryNe] = useState('')
  const [summaryEn, setSummaryEn] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setDone(null)
    if (!articleId) {
      setError('कुन समाचारमा सच्याउने हो छान्नुहोस्।')
      return
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(articleId)}/corrections`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          summaryNe,
          summaryEn: summaryEn.trim() || undefined,
          severity,
          requestId,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string; publicPath?: string }
      if (!res.ok) {
        setError(String(body.error ?? 'सच्याइएको विवरण थप्न सकिएन।'))
        return
      }
      setSummaryNe('')
      setSummaryEn('')
      setDone(body.publicPath ?? 'प्रकाशित भयो।')
      router.refresh()
    })
  }

  const fieldId = requestId ?? 'adhoc'

  return (
    <form className="grid gap-3" onSubmit={submit} aria-busy={pending}>
      <AdminSelect
        label="समाचार"
        name={`correction-article-${fieldId}`}
        value={articleId}
        onChange={(event) => setArticleId(event.target.value)}
        options={articles.map((article) => ({ value: article.id, label: article.label }))}
      />
      <AdminSelect
        label="प्रकार"
        name={`correction-severity-${fieldId}`}
        value={severity}
        onChange={(event) => setSeverity(event.target.value as CorrectionSeverity)}
        options={SEVERITY_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
      />
      <AdminTextarea
        label="पाठकलाई देखिने विवरण"
        name={`correction-summary-ne-${fieldId}`}
        value={summaryNe}
        onChange={(event) => setSummaryNe(event.target.value)}
        required
        rows={3}
        lang="ne"
        hint="के गलत थियो र अहिले के छ, एक वाक्यमा। यो लेखमै मिति सहित देखिन्छ।"
      />
      <AdminTextarea
        label="English (ऐच्छिक)"
        name={`correction-summary-en-${fieldId}`}
        value={summaryEn}
        onChange={(event) => setSummaryEn(event.target.value)}
        rows={2}
        lang="en"
      />
      {error ? (
        <p className="text-caption text-breaking" role="alert" lang="ne">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="text-caption text-ink-soft" role="status" lang="ne">
          जारी भयो — <span className="font-mono">{done}</span>
        </p>
      ) : null}
      <div>
        <AdminButton type="submit" disabled={pending || summaryNe.trim().length === 0}>
          सच्याइएको विवरण जारी गर्नुहोस्
        </AdminButton>
      </div>
    </form>
  )
}
