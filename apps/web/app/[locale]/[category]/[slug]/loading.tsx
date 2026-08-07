import { ArticleBodySkeleton } from '@nagarikwatch/ui'

/**
 * Article soft-nav: hero plane + body column (max-w-body) to hold LCP geometry.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-body">
        <ArticleBodySkeleton />
      </div>
    </div>
  )
}
