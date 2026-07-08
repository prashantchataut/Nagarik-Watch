'use client'

import { useState } from 'react'

type WireItem = {
  titleNe: string
  titleEn?: string
  sourceName: string
  sourceUrl: string
  sourcePublishedAt: string
  sourceType: string
}

/**
 * WireBrowser — client component that renders the RSS headline list and
 * handles the "develop story" action. Clicking the button opens the article
 * editor with the source pre-filled as attribution (sourceName + sourceUrl),
 * so the editor writes an original article, not a copy.
 */
export function WireBrowser({ items }: { items: WireItem[] }) {
  const [filter, setFilter] = useState('')
  const filtered = items.filter(
    (i) =>
      !filter ||
      i.titleNe.includes(filter) ||
      (i.titleEn ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      i.sourceName.includes(filter),
  )

  function develop(item: WireItem) {
    // Encode the source info into the URL query. The article editor reads
    // these and pre-fills the source attribution fields.
    const params = new URLSearchParams({
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceType: item.sourceType,
      title: item.titleNe,
    })
    window.location.href = `/admin/articles/new?${params.toString()}`
  }

  return (
    <div>
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="फिल्टर गर्नुहोस्…"
        className="mb-4 h-10 w-full max-w-md rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
        lang="ne"
      />
      <ul className="space-y-2">
        {filtered.map((item, i) => (
          <li
            key={`${item.sourceUrl}-${i}`}
            className="rounded-lg border border-rule bg-surface-raised p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p
                  className="text-caption font-semibold uppercase tracking-wide text-brand-strong"
                  lang="ne"
                >
                  {item.sourceName}
                </p>
                <p className="mt-1 font-display text-body-lg font-semibold text-ink" lang="ne">
                  {item.titleNe}
                </p>
                <p className="mt-1 text-caption text-mute">
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
                    lang="ne"
                  >
                    मूल स्रोत हेर्नुहोस् →
                  </a>
                  {' · '}
                  {new Date(item.sourcePublishedAt).toLocaleString('ne-NP')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => develop(item)}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-meta font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint"
                lang="ne"
              >
                + समाचार विकास गर्नुहोस्
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
