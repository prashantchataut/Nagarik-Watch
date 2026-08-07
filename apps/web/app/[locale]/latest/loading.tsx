import { DenseStoryRowSkeleton } from '@nagarikwatch/ui'

/** Latest / hub-style dense list soft-nav. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5" aria-busy="true" aria-live="polite">
      <div className="mb-4 space-y-2 border-b border-rule pb-4" aria-hidden="true">
        <div className="h-3 w-16 animate-pulse bg-surface-raised" />
        <div className="h-8 w-40 animate-pulse bg-surface-raised" />
      </div>
      <div className="divide-y divide-rule border-y border-rule" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <DenseStoryRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
