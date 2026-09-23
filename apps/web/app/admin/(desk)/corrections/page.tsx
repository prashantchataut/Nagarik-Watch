import { formatAdDateTime } from '@nagarikwatch/db'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, PUBLISHER_ROLES } from '@/lib/admin-roles'
import {
  AdminCard,
  AdminCallout,
  AdminEmptyState,
  AdminPageHeader,
} from '@/components/admin/primitives'
import { CorrectionIssueForm } from '@/components/admin/CorrectionIssueForm'
import { listSubmissions } from '@/lib/submissions'
import { getStories } from '@/lib/content'
import { buildStoryEngagementIndex } from '@/lib/ranking-signals'
import { orEmpty } from '@/lib/resilience/or-empty'
import {
  rankCorrectionRequests,
  type CorrectionReasonCode,
  type CorrectionSeverity,
  type CorrectionTarget,
} from '@/lib/editorial/correction-urgency'

export const metadata: Metadata = {
  title: 'सच्याइएका विवरण',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

/**
 * How far back the desk looks for the story a request is about. A correction
 * filed against a two-year-old archive piece still gets issued — the editor
 * picks the article by hand — but the matcher only searches the window where
 * an unmatched request is likely to be a fresh mistake.
 */
const TARGET_WINDOW = 200

const SEVERITY_NE: Record<CorrectionSeverity, string> = {
  retraction: 'खारेजी / फिर्ता',
  factual: 'तथ्य गलत',
  attribution: 'श्रेय / स्रोत',
  clarification: 'स्पष्टीकरण',
  typo: 'हिज्जे',
}

const REASON_NE: Record<CorrectionReasonCode, string> = {
  severe: 'गम्भीर दाबी',
  'high-reach': 'धेरै पाठक पुगेको समाचार',
  aging: 'जवाफ कुरिरहेको',
  overdue: '७२ घण्टाभन्दा बढी अनुत्तरित',
  unmatched: 'कुन समाचार हो पत्ता लागेन',
  'no-telemetry': 'पाठक तथ्यांक छैन, मितिका आधारमा',
}

function severityTone(severity: CorrectionSeverity): 'neutral' | 'attention' | 'danger' {
  if (severity === 'retraction') return 'danger'
  if (severity === 'factual') return 'attention'
  return 'neutral'
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatAdDateTime(date, 'ne')
}

export default async function CorrectionsPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, PUBLISHER_ROLES)

  const [submissions, window, engagement] = await Promise.all([
    orEmpty(listSubmissions({ limit: 200 })),
    getStories({ locale: 'ne', perPage: TARGET_WINDOW }).catch(() => null),
    buildStoryEngagementIndex().catch(() => null),
  ])

  const stories = window?.items ?? []
  const targets: CorrectionTarget[] = stories.map((story) => ({
    slug: story.slug,
    categorySlug: story.category.slug,
    title: story.titleNe,
    publishedAt: story.publishedAt,
    readers: engagement?.bySlug.get(story.slug)?.uniqueReaders ?? 0,
  }))
  const articleIdBySlug = new Map(stories.map((story) => [story.slug, story.id]))
  const articleOptions = stories.map((story) => ({
    id: story.id,
    label: `${story.category.slug}/${story.slug} — ${story.titleNe}`,
  }))

  const open = submissions.filter(
    (entry) =>
      entry.type === 'correction' && (entry.status === 'new' || entry.status === 'in_review'),
  )
  const ranked = rankCorrectionRequests(
    open.map((entry) => ({
      id: entry.id,
      headline: entry.headline,
      description: entry.description,
      createdAt: entry.createdAt,
      evidenceUrl: entry.evidenceUrl,
    })),
    targets,
  )
  const byId = new Map(open.map((entry) => [entry.id, entry]))
  const overdue = ranked.filter((entry) => entry.reasons.includes('overdue')).length

  return (
    <div>
      <AdminPageHeader subtitle="पाठकबाट आएका सच्याउने अनुरोध, जरुरी क्रममा — र लेखमा विवरण जारी गर्ने ठाउँ" />

      {overdue > 0 ? (
        <AdminCallout tone="danger" className="mb-5">
          <p lang="ne">
            {overdue} वटा अनुरोध ७२ घण्टाभन्दा बढी अनुत्तरित छन्। सच्याउने नीति सार्वजनिक छ — जवाफ
            नदिनु नीति नहुनुभन्दा बढी महँगो पर्छ।
          </p>
        </AdminCallout>
      ) : null}

      {ranked.length === 0 ? (
        <AdminEmptyState
          title="खुला अनुरोध छैन"
          body="/submit-story बाट correction प्रकारका अनुरोध आएपछि यहाँ जरुरी क्रममा देखिन्छन्।"
        />
      ) : (
        <div className="grid gap-4">
          {ranked.map((entry) => {
            const submission = byId.get(entry.id)
            if (!submission) return null
            const matchedId = entry.target ? articleIdBySlug.get(entry.target.slug) : undefined
            return (
              <AdminCard key={entry.id} className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-h3 text-ink" lang="ne">
                      {submission.headline}
                    </p>
                    <p className="mt-1 text-meta text-ink-soft" lang="ne">
                      {submission.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-meta text-ink">
                      {Math.round(entry.urgency * 100)}%
                    </p>
                    <p className="text-caption text-mute" lang="ne">
                      जरुरी
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`admin-status admin-status--${severityTone(entry.severity)}`}
                    lang="ne"
                  >
                    {SEVERITY_NE[entry.severity]}
                  </span>
                  {entry.reasons.map((reason) => (
                    <span key={reason} className="text-caption text-mute" lang="ne">
                      {REASON_NE[reason]}
                    </span>
                  ))}
                  <span className="text-caption text-mute" lang="ne">
                    {formatDate(submission.createdAt)} ({Math.round(entry.hoursOpen)} घण्टा)
                  </span>
                </div>

                {entry.target ? (
                  <p className="text-caption text-mute">
                    <span lang="ne">मिल्दो समाचार: </span>
                    <span className="font-mono">
                      /{entry.target.categorySlug}/{entry.target.slug}
                    </span>
                  </p>
                ) : null}

                {submission.evidenceUrl ? (
                  <p className="break-all text-caption text-mute">
                    <span lang="ne">प्रमाण: </span>
                    <span className="font-mono">{submission.evidenceUrl}</span>
                  </p>
                ) : null}

                {articleOptions.length === 0 ? (
                  <p className="text-caption text-mute" lang="ne">
                    प्रकाशित समाचार नभएसम्म विवरण जारी गर्न मिल्दैन।
                  </p>
                ) : (
                  <CorrectionIssueForm
                    requestId={entry.id}
                    articles={articleOptions}
                    defaultArticleId={matchedId}
                    defaultSeverity={entry.severity}
                  />
                )}
              </AdminCard>
            )
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-display text-h2 text-ink" lang="ne">
        अनुरोध बिनाको सच्याइ
      </h2>
      <AdminCard>
        <p className="mb-3 text-caption text-mute" lang="ne">
          पाठकले नभनेको तर आफैँले भेट्टाएको गल्ती पनि उत्तिकै सार्वजनिक हुनुपर्छ।
        </p>
        {articleOptions.length === 0 ? (
          <p className="text-meta text-ink-soft" lang="ne">
            प्रकाशित समाचार अझै छैन।
          </p>
        ) : (
          <CorrectionIssueForm articles={articleOptions} defaultSeverity="factual" />
        )}
      </AdminCard>
    </div>
  )
}
