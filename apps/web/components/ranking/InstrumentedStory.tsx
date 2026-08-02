'use client'

import { useRef, type ReactNode } from 'react'
import { RankingImpression, trackRankingClick } from '@/components/ranking/RankingImpression'

/** Wraps a public story card with impression + click instrumentation. */
export function InstrumentedStory({
  articleSlug,
  articleCategory,
  children,
  className = 'min-w-0',
}: {
  articleSlug: string
  articleCategory: string
  children: ReactNode
  /** Layout box for IntersectionObserver — avoid display:contents. */
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={rootRef}
      className={className}
      onClickCapture={() => trackRankingClick(articleSlug, articleCategory)}
    >
      <RankingImpression
        articleSlug={articleSlug}
        articleCategory={articleCategory}
        targetRef={rootRef}
      />
      {children}
    </div>
  )
}
