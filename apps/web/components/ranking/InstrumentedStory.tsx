'use client'

import type { ReactNode } from 'react'
import { RankingImpression, trackRankingClick } from '@/components/ranking/RankingImpression'

/** Wraps a public story card with impression + click instrumentation. */
export function InstrumentedStory({
  articleSlug,
  articleCategory,
  children,
}: {
  articleSlug: string
  articleCategory: string
  children: ReactNode
}) {
  return (
    <div
      className="contents"
      onClickCapture={() => trackRankingClick(articleSlug, articleCategory)}
    >
      <RankingImpression articleSlug={articleSlug} articleCategory={articleCategory} />
      {children}
    </div>
  )
}
