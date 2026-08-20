'use client'

import { useId, useState } from 'react'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

type ViewMode = 'list' | 'grid'

type CategoryMoreStoriesProps = {
  stories: StoryCardData[]
  locale: Locale
  heading?: { ne: string; en: string }
}

/**
 * Section body under the category lead: list (default) or thumb grid.
 * Provides a dense category view switcher without duplicating global chrome.
 */
export function CategoryMoreStories({ stories, locale, heading }: CategoryMoreStoriesProps) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const [view, setView] = useState<ViewMode>('list')
  const headingId = useId()
  if (!stories.length) return null

  const title =
    heading != null ? (english ? heading.en : heading.ne) : english ? 'More stories' : 'थप समाचार'

  return (
    <section aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-2">
        <div>
          <h2 id={headingId} className="font-display text-h3 font-extrabold text-ink" lang={lang}>
            {title}
          </h2>
          <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        </div>
        <div
          className="inline-flex items-center gap-0.5 rounded-sm border border-rule bg-surface-raised p-0.5"
          role="group"
          aria-label={english ? 'Story layout' : 'समाचार लेआउट'}
        >
          <ViewButton
            active={view === 'list'}
            onClick={() => setView('list')}
            label={english ? 'List' : 'सूची'}
            icon="list"
          />
          <ViewButton
            active={view === 'grid'}
            onClick={() => setView('grid')}
            label={english ? 'Grid' : 'ग्रिड'}
            icon="grid"
          />
        </div>
      </div>

      {view === 'list' ? (
        <ul className="mt-2 divide-y divide-rule">
          {stories.map((story) => (
            <li key={story.id} className="py-2.5">
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <DenseStoryItem story={story} locale={locale} thumb="md" showDeck />
              </InstrumentedStory>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <li key={story.id} className="min-w-0">
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <StoryCard story={story} locale={locale} variant="default" />
              </InstrumentedStory>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ViewButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: 'list' | 'grid'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'inline-flex min-h-8 items-center gap-1.5 rounded-sm bg-brand px-2.5 text-caption font-bold text-paper'
          : 'inline-flex min-h-8 items-center gap-1.5 rounded-sm px-2.5 text-caption font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-ink'
      }
    >
      {icon === 'list' ? <ListIcon /> : <GridIcon />}
      <span>{label}</span>
    </button>
  )
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
