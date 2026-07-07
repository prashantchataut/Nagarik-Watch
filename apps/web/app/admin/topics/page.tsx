import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { seedTags } from '@/lib/content/seed-source'
import {
  AdminPageHeader,
  AdminButton,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विषय',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Topics — the same Tag collection as /admin/tags but framed as subject
 * areas (content-model.md §4 calls tags "topics" interchangeably). The
 * grid layout, copy and empty-state framing here is topic-shaped: long-
 * running story arcs (elections, climate, migration…) rather than the
 * flat pill rail on /admin/tags. Same data source, different editorial
 * surface, so editors can pick the view that matches their workflow.
 */
export default async function TopicsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const storiesResult = await getStories({ locale: 'ne', perPage: 1000 })
  // StoryCardData type doesn't declare `tags`, but the content source returns
  // Article-shaped objects (with tags) — the cast is safe at runtime.
  type StoryWithTags = { tags?: { slug: string; nameNe?: string; nameEn?: string }[] }
  const countsByTopicSlug = new Map<string, number>()
  for (const s of storiesResult.items) {
    const tags = (s as StoryWithTags).tags ?? []
    for (const t of tags) {
      countsByTopicSlug.set(
        t.slug,
        (countsByTopicSlug.get(t.slug) ?? 0) + 1,
      )
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="विषय"
        subtitle="चलिरहेका कथाका विषयगत समूह — एउटै विषयमा धेरै विभागका समाचार जोड्छ"
        action={
          <AdminButton disabled title="नयाँ विषय बनाउन Payload कन्फिगरेसन आवश्यक छ">
            + नयाँ विषय
          </AdminButton>
        }
      />

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {seedTags.map((t) => {
          const count = countsByTopicSlug.get(t.slug) ?? 0
          return (
            <li
              key={t.slug}
              className="group rounded-lg border border-rule bg-surface-raised p-5 transition-shadow duration-fast ease-out-quint hover:border-brand hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/topics/${t.slug}`}
                    className="font-display text-h2 text-ink hover:text-brand-strong"
                    lang="ne"
                  >
                    {t.nameNe}
                  </Link>
                  {t.nameEn && (
                    <p className="mt-0.5 text-meta text-ink-soft" lang="en">
                      {t.nameEn}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-brand-tint px-3 py-1 text-meta font-semibold text-brand-strong">
                  <span lang="ne">{count}</span> <span lang="ne">समाचार</span>
                </span>
              </div>
              {t.descriptionNe && (
                <p className="mt-3 line-clamp-2 text-body text-ink-soft" lang="ne">
                  {t.descriptionNe}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-mute" lang="en">
                  /topic/{t.slug}
                </code>
                <Link
                  href={`/admin/topics/${t.slug}`}
                  className="text-meta font-semibold text-brand hover:text-brand-strong"
                  lang="ne"
                >
                  व्यवस्थापन →
                </Link>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
