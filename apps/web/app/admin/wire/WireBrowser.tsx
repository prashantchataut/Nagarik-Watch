'use client'

import { useState } from 'react'

type WireItem = {
  titleNe: string
  titleEn?: string
  sourceName: string
  sourceUrl: string
  sourcePublishedAt?: string
  retrievedAt: string
  sourceType: string
}

export function WireBrowser({
  items,
  payloadCreateUrl,
}: {
  items: WireItem[]
  payloadCreateUrl?: string
}) {
  const [filter, setFilter] = useState('')
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const filtered = items.filter(
    (item) =>
      !filter ||
      item.titleNe.includes(filter) ||
      (item.titleEn ?? '').toLowerCase().includes(filter.toLowerCase()) ||
      item.sourceName.includes(filter),
  )

  async function develop(item: WireItem) {
    const sourceNote = [
      item.titleNe,
      `Source: ${item.sourceName}`,
      item.sourceUrl,
      item.sourcePublishedAt ? `Published: ${item.sourcePublishedAt}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await navigator.clipboard.writeText(sourceNote)
      setCopiedUrl(item.sourceUrl)
    } catch {
      setCopiedUrl(null)
    }

    if (payloadCreateUrl) {
      window.open(payloadCreateUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const params = new URLSearchParams({
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceType: item.sourceType,
      title: item.titleNe,
      ...(item.sourcePublishedAt ? { sourcePublishedAt: item.sourcePublishedAt } : {}),
    })
    window.location.href = `/admin/articles/new?${params.toString()}`
  }

  return (
    <div>
      <input
        type="search"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder="स्रोत वा शीर्षक खोज्नुहोस्…"
        className="mb-4 h-10 w-full max-w-md rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
        lang="ne"
      />
      <ul className="space-y-2">
        {filtered.map((item) => (
          <li key={item.sourceUrl} className="rounded-lg border border-rule bg-surface-raised p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-caption font-semibold uppercase tracking-wide text-brand-strong" lang="ne">
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
                  {item.sourcePublishedAt
                    ? new Date(item.sourcePublishedAt).toLocaleString('ne-NP')
                    : 'स्रोतले प्रकाशन समय दिएको छैन'}
                </p>
                {copiedUrl === item.sourceUrl ? (
                  <p className="mt-2 text-caption font-semibold text-brand-strong" role="status" lang="ne">
                    शीर्षक र स्रोत विवरण क्लिपबोर्डमा प्रतिलिपि भयो। Payload मा मौलिक रिपोर्टिङ लेख्नुहोस्।
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => develop(item)}
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-brand px-4 text-meta font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint"
                lang="ne"
              >
                + Payload ड्राफ्ट खोल्नुहोस्
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
