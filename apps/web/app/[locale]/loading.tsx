import { DenseStoryRowSkeleton, StoryCardSkeleton } from '@nagarikwatch/ui'

/** Generic public-route soft navigation state. Never leak newsroom/admin chrome into reader pages. */
export default function Loading() {
  return (
    <div
      className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5" aria-hidden="true">
        <div className="h-8 w-1 bg-brand" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-8 w-48 animate-pulse bg-surface-raised" />
          <div className="h-4 w-full max-w-md animate-pulse bg-surface-raised" />
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-start">
        <StoryCardSkeleton variant="featured" />
        <div className="divide-y divide-rule border-y border-rule">
          {Array.from({ length: 4 }).map((_, index) => (
            <DenseStoryRowSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}
