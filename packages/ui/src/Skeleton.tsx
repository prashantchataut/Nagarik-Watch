import { cn } from './cn'

/**
 * Bone-white... not quite. A skeleton uses the rule/raise tokens (warm-tinted, never #fff) with
 * a slow opacity shimmer. The shimmer is transform-based (scaleX on a gradient overlay) so it
 * never thrashes layout, and it is killed by prefers-reduced-motion via tokens.css. Each shape
 * matches the real component it stands in for, to hold the box and prevent CLS while loading.
 */
const shimmerBase =
  'relative overflow-hidden bg-surface-raised before:absolute before:inset-0 before:origin-left before:animate-[shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-rule/60 before:to-transparent'

type StoryCardSkeletonProps = {
  variant?: 'default' | 'featured'
  className?: string
}

export function StoryCardSkeleton({ variant = 'default', className }: StoryCardSkeletonProps) {
  const isFeatured = variant === 'featured'
  return (
    <div className={cn('flex flex-col', className)} aria-hidden="true">
      <div className={cn(shimmerBase, isFeatured ? 'mb-3 aspect-[16/9]' : 'mb-3 aspect-[4/3]')} />
      <div className={cn(shimmerBase, 'mb-2 h-4 w-20 rounded-sm')} />
      <div className={cn(shimmerBase, 'mb-2 h-5 w-full rounded-sm')} />
      <div className={cn(shimmerBase, 'h-5 w-3/4 rounded-sm')} />
    </div>
  )
}

export function StoryGridSkeleton({
  count = 6,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <ul className={cn('grid gap-8 sm:grid-cols-2 lg:grid-cols-3', className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <StoryCardSkeleton />
        </li>
      ))}
    </ul>
  )
}

/** Dense thumb + headline row (sidebar / “more” lists). */
export function DenseStoryRowSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-2.5 sm:grid-cols-[5rem_minmax(0,1fr)]', className)} aria-hidden="true">
      <div className={cn(shimmerBase, 'aspect-[4/3] rounded-sm')} />
      <div className="min-w-0 space-y-2">
        <div className={cn(shimmerBase, 'h-3 w-16 rounded-sm')} />
        <div className={cn(shimmerBase, 'h-4 w-full rounded-sm')} />
        <div className={cn(shimmerBase, 'h-4 w-4/5 rounded-sm')} />
      </div>
    </div>
  )
}

/**
 * A1 portal-feed bone: centered pill → headline lines → byline → 16:9 image plane.
 * Matches MegaStoryBlock geometry for homepage soft-nav.
 */
export function MegaStoryBlockSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('text-center', className)} aria-hidden="true">
      <div className="mx-auto flex max-w-[46rem] flex-col items-center">
        <div className={cn(shimmerBase, 'mb-2.5 h-6 w-24 rounded-sm')} />
        <div className={cn(shimmerBase, 'mb-2 h-8 w-full max-w-xl rounded-sm sm:h-10')} />
        <div className={cn(shimmerBase, 'mb-2 h-8 w-[88%] max-w-lg rounded-sm sm:h-10')} />
        <div className={cn(shimmerBase, 'h-8 w-[70%] max-w-md rounded-sm sm:h-9')} />
        <div className={cn(shimmerBase, 'mt-3 h-4 w-40 rounded-sm')} />
      </div>
      <div className={cn(shimmerBase, 'mt-4 aspect-[16/10] w-full sm:mt-5 sm:aspect-[16/9]')} />
    </div>
  )
}

/** Homepage A1 soft-nav: 2–3 mega blocks + thin desk hint. */
export function HomeFeedSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-page space-y-8 px-3 py-4 sm:px-4 sm:py-5', className)} aria-busy="true" aria-live="polite">
      <MegaStoryBlockSkeleton />
      <div className="border-t border-rule pt-8">
        <MegaStoryBlockSkeleton />
      </div>
      <div className="border-t border-rule pt-8">
        <MegaStoryBlockSkeleton />
      </div>
      <div className="border-t border-rule pt-6">
        <div className={cn(shimmerBase, 'mb-3 h-5 w-32 rounded-sm')} />
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <DenseStoryRowSkeleton key={i} className="border-b border-rule sm:px-2" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Category / topic / hub desk bone: Hero column + side rail rows + more list.
 */
export function CategoryDeskSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-5', className)} aria-hidden="true">
      <div className="grid gap-4 border-b border-rule pb-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(16rem,0.75fr)] xl:items-start xl:gap-5">
        <div>
          <div className={cn(shimmerBase, 'mb-2 h-4 w-20 rounded-sm')} />
          <div className={cn(shimmerBase, 'mb-2 h-8 w-full rounded-sm')} />
          <div className={cn(shimmerBase, 'mb-2 h-8 w-4/5 rounded-sm')} />
          <div className={cn(shimmerBase, 'mb-3 h-4 w-48 rounded-sm')} />
          <div className={cn(shimmerBase, 'aspect-[16/10] w-full sm:aspect-[16/9]')} />
        </div>
        <aside className="min-w-0 border-t border-rule pt-3 xl:border-t-0 xl:pl-5 xl:pt-0">
          <div className={cn(shimmerBase, 'mb-2 h-3 w-28 rounded-sm')} />
          <div className="divide-y divide-rule border-y border-rule">
            {Array.from({ length: 4 }).map((_, i) => (
              <DenseStoryRowSkeleton key={i} />
            ))}
          </div>
        </aside>
      </div>
      <div>
        <div className={cn(shimmerBase, 'mb-3 h-5 w-36 rounded-sm')} />
        <div className="divide-y divide-rule">
          {Array.from({ length: 5 }).map((_, i) => (
            <DenseStoryRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Article column: 16:9 hero plane, then title + prose lines (max-w-body).
 */
export function ArticleBodySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-5', className)} aria-hidden="true">
      <div className={cn(shimmerBase, 'aspect-[16/9] w-full')} />
      <div className={cn(shimmerBase, 'h-4 w-24 rounded-sm')} />
      <div className={cn(shimmerBase, 'h-8 w-full rounded-sm')} />
      <div className={cn(shimmerBase, 'h-8 w-2/3 rounded-sm')} />
      <div className={cn(shimmerBase, 'h-4 w-40 rounded-sm')} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(shimmerBase, 'h-4 w-full rounded-sm')} />
      ))}
      <div className={cn(shimmerBase, 'h-4 w-5/6 rounded-sm')} />
    </div>
  )
}

/** पात्रो desk: today banner + sidebar widgets + month grid + tiles. */
export function PatroDeskSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-5', className)} aria-busy="true" aria-live="polite" aria-hidden="true">
      <div className="flex items-center gap-4 border-b border-rule pb-4">
        <div className={cn(shimmerBase, 'h-[5.25rem] w-[5.25rem] shrink-0 rounded-full')} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className={cn(shimmerBase, 'h-3 w-16 rounded-sm')} />
          <div className={cn(shimmerBase, 'h-7 w-3/4 max-w-sm rounded-sm')} />
          <div className={cn(shimmerBase, 'h-4 w-40 rounded-sm')} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(14rem,0.32fr)_minmax(0,1fr)] lg:gap-5">
        <aside className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-rule p-3">
              <div className={cn(shimmerBase, 'mb-3 h-4 w-28 rounded-sm')} />
              <div className="space-y-2">
                <div className={cn(shimmerBase, 'h-3 w-full rounded-sm')} />
                <div className={cn(shimmerBase, 'h-3 w-5/6 rounded-sm')} />
                <div className={cn(shimmerBase, 'h-3 w-2/3 rounded-sm')} />
              </div>
            </div>
          ))}
        </aside>
        <div className="space-y-4">
          <div className={cn(shimmerBase, 'aspect-[7/5] w-full sm:aspect-[16/10]')} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn(shimmerBase, 'h-12 rounded-sm')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Short “recommended” rail bone for homepage Suspense. */
export function RecommendedRailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border-t border-rule pt-5', className)} aria-hidden="true">
      <div className={cn(shimmerBase, 'mb-3 h-5 w-44 rounded-sm')} />
      <div className="divide-y divide-rule border-y border-rule">
        {Array.from({ length: 4 }).map((_, i) => (
          <DenseStoryRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
