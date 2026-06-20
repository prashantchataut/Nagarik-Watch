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

export function ArticleBodySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)} aria-hidden="true">
      <div className={cn(shimmerBase, 'h-4 w-24 rounded-sm')} />
      <div className={cn(shimmerBase, 'h-8 w-full rounded-sm')} />
      <div className={cn(shimmerBase, 'h-8 w-2/3 rounded-sm')} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(shimmerBase, 'h-4 w-full rounded-sm')} />
      ))}
      <div className={cn(shimmerBase, 'h-4 w-5/6 rounded-sm')} />
    </div>
  )
}
