import { ArticleBodySkeleton } from '@nagarikwatch/ui'

/**
 * Article loading fallback. Mirrors the article body column (max-w-body) so the prose box is
 * held while the article resolves — preventing CLS on the slowest data path.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-body px-4 py-8" aria-hidden="true">
      <ArticleBodySkeleton />
    </div>
  )
}
