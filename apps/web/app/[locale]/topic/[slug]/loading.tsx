import { CategoryDeskSkeleton } from '@nagarikwatch/ui'

/** Topic listing soft-nav — same desk language as category. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5" aria-busy="true" aria-live="polite">
      <div className="mb-4 space-y-2 border-b border-rule pb-4" aria-hidden="true">
        <div className="h-3 w-20 animate-pulse bg-surface-raised" />
        <div className="h-8 w-56 animate-pulse bg-surface-raised" />
      </div>
      <CategoryDeskSkeleton />
    </div>
  )
}
