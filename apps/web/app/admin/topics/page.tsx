import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { listTaxonomyTerms } from '@/lib/taxonomy-admin'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { AdminPageHeader, AdminButton } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विषय',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function TopicsPage() {
  await requireNewsroomSession()
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('tags'))
  const [storiesResult, terms] = await Promise.all([
    getStories({ locale: 'ne', perPage: 1000 }),
    listTaxonomyTerms('tag'),
  ])
  type StoryWithTags = { tags?: { slug: string }[] }
  const countsByTopicSlug = new Map<string, number>()
  for (const story of storiesResult.items) {
    for (const tag of (story as StoryWithTags).tags ?? []) {
      countsByTopicSlug.set(tag.slug, (countsByTopicSlug.get(tag.slug) ?? 0) + 1)
    }
  }
  const activeTerms = terms.filter((term) => term.status !== 'archived')

  return (
    <div>
      <AdminPageHeader
        title="विषय"
        subtitle="विभिन्न समाचार विभाग जोड्ने दीर्घकालीन विषय र स्टोरी आर्क"
        action={<AdminButton href="/admin/tags">+ विषय व्यवस्थापन</AdminButton>}
      />

      {activeTerms.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeTerms.map((term) => {
            const count = countsByTopicSlug.get(term.slug) ?? 0
            return (
              <li key={term.id} className="rounded-lg border border-rule bg-surface-raised p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/topic/${term.slug}`}
                      className="font-display text-h2 text-ink hover:text-brand-strong"
                      lang="ne"
                    >
                      {term.nameNe}
                    </Link>
                    <p className="mt-0.5 text-meta text-ink-soft" lang="en">
                      {term.nameEn}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-tint px-3 py-1 text-meta font-semibold text-brand-strong">
                    {count} समाचार
                  </span>
                </div>
                {term.descriptionNe ? (
                  <p className="mt-3 line-clamp-2 text-body text-ink-soft" lang="ne">
                    {term.descriptionNe}
                  </p>
                ) : null}
                <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
                  <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-mute">
                    /topic/{term.slug}
                  </code>
                  <Link
                    href="/admin/tags"
                    className="text-meta font-semibold text-brand hover:text-brand-strong"
                    lang="ne"
                  >
                    सम्पादन →
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <section className="rounded-lg border border-dashed border-rule p-8 text-center">
          <h2 className="font-display text-h2 text-ink" lang="ne">कुनै सक्रिय विषय छैन</h2>
          <p className="mt-2 text-body text-ink-soft" lang="ne">
            ट्याग व्यवस्थापनबाट पहिलो विषय सिर्जना गर्नुहोस्।
          </p>
          <AdminButton href="/admin/tags" className="mt-5">विषय सिर्जना गर्नुहोस्</AdminButton>
        </section>
      )}
    </div>
  )
}
