import { CategoryDeskSkeleton } from '@nagarikwatch/ui'

/** Category listing soft-nav — matches CategoryDesk packing. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5" aria-busy="true" aria-live="polite">
      <div className="mb-4 space-y-2 border-b border-rule pb-4" aria-hidden="true">
        <div className="h-3 w-16 animate-pulse bg-surface-raised" />
        <div className="h-8 w-48 animate-pulse bg-surface-raised" />
      </div>
      <CategoryDeskSkeleton />
    </div>
  )
}
