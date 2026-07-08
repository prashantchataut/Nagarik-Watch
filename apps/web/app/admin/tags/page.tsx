import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { seedTags } from '@/lib/content/seed-source'
import { AdminPageHeader, AdminButton } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'ट्याग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Tags. Cross-category running-story groupings (content-model.md §4). The
 * seed exports seven tags; the grid shows each as a pill with nameNe,
 * nameEn, slug, and a live article count pulled from the content façade.
 * New-tag is a styled placeholder until the Payload create flow is wired.
 */
export default async function TagsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const storiesResult = await getStories({ locale: 'ne', perPage: 1000 })
  // StoryCardData type doesn't declare `tags`, but the content source returns
  // Article-shaped objects (with tags) — the cast is safe at runtime.
  type StoryWithTags = { tags?: { slug: string; nameNe?: string; nameEn?: string }[] }
  const countsByTagSlug = new Map<string, number>()
  for (const s of storiesResult.items) {
    const tags = (s as StoryWithTags).tags ?? []
    for (const t of tags) {
      countsByTagSlug.set(t.slug, (countsByTagSlug.get(t.slug) ?? 0) + 1)
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="ट्याग"
        subtitle={`कुल ${seedTags.length} वटा ट्याग`}
        action={
          <AdminButton disabled title="नयाँ ट्याग बनाउन Payload कन्फिगरेसन आवश्यक छ">
            + नयाँ ट्याग
          </AdminButton>
        }
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seedTags.map((t) => {
          const count = countsByTagSlug.get(t.slug) ?? 0
          return (
            <li key={t.slug}>
              <Link
                href={`/admin/tags/${t.slug}`}
                className="flex h-full flex-col gap-2 rounded-lg border border-rule bg-surface-raised p-4 transition-shadow duration-fast ease-out-quint hover:border-brand hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display text-h3 text-ink" lang="ne">
                    {t.nameNe}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand-tint px-2.5 py-0.5 text-caption font-semibold text-brand-strong">
                    {count}
                  </span>
                </div>
                {t.nameEn && (
                  <p className="text-meta text-ink-soft" lang="en">
                    {t.nameEn}
                  </p>
                )}
                <code
                  className="mt-auto inline-block w-fit rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-mute"
                  lang="en"
                >
                  #{t.slug}
                </code>
                {t.descriptionNe && (
                  <p className="line-clamp-2 text-caption text-ink-soft" lang="ne">
                    {t.descriptionNe}
                  </p>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
