import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { seedAuthors } from '@/lib/content/seed-source'
import {
  AdminPageHeader,
  AdminButton,
  StatusBadge,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लेखक',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Authors / bylines. Reads the seed author list (lib/content/seed/authors)
 * and shows a card per author with role, slug, bio excerpt, and a live
 * article count pulled from the content façade. New-author is a styled
 * placeholder until the Payload author collection is wired from apps/web.
 */
export default async function AuthorsPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const storiesResult = await getStories({ locale: 'ne', perPage: 1000 })
  const countsByAuthorSlug = new Map<string, number>()
  for (const s of storiesResult.items) {
    for (const a of s.authors) {
      countsByAuthorSlug.set(a.slug, (countsByAuthorSlug.get(a.slug) ?? 0) + 1)
    }
  }

  const roleLabel: Record<string, string> = {
    staff: 'स्टाफ',
    columnist: 'स्तम्भकार',
    contributor: 'योगदानकर्ता',
    wire: 'एजेन्सी',
  }

  return (
    <div>
      <AdminPageHeader
        title="लेखक"
        subtitle={`कुल ${seedAuthors.length} जना लेखक / स्तम्भकार`}
        action={
          <AdminButton disabled title="नयाँ लेखक बनाउन Payload कन्फिगरेसन आवश्यक छ">
            + नयाँ लेखक
          </AdminButton>
        }
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seedAuthors.map((a) => {
          const count = countsByAuthorSlug.get(a.slug) ?? 0
          return (
            <li key={a.slug}>
              <Link
                href={`/admin/authors/${a.slug}`}
                className="flex h-full flex-col gap-3 rounded-lg border border-rule bg-surface-raised p-5 transition-shadow duration-fast ease-out-quint hover:border-brand hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-h2 text-ink" lang="ne">
                      {a.name}
                    </p>
                    <p className="mt-0.5 text-caption text-mute" lang="en">
                      {a.slug}
                    </p>
                  </div>
                  <span className="shrink-0">
                    <StatusBadge status={a.isActive ? 'published' : 'archived'} />
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-tint px-2.5 py-0.5 text-caption font-semibold text-brand-strong" lang="ne">
                    {roleLabel[a.role] ?? a.role}
                  </span>
                  <span className="rounded-full border border-rule px-2.5 py-0.5 text-caption font-semibold text-ink-soft">
                    <span lang="ne">{count}</span> <span lang="ne">समाचार</span>
                  </span>
                </div>

                {a.bioNe && (
                  <p className="line-clamp-3 text-body text-ink-soft" lang="ne">
                    {a.bioNe}
                  </p>
                )}

                <div className="mt-auto border-t border-rule pt-3">
                  <span className="text-meta font-semibold text-brand hover:text-brand-strong" lang="ne">
                    प्रोफाइल हेर्नुहोस् →
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
