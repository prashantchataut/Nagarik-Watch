import { StoryGridSkeleton } from '@nagarikwatch/ui'

const shimmerBase =
  'relative overflow-hidden bg-surface-raised before:absolute before:inset-0 before:origin-left before:animate-[shimmer_1.6s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-rule/60 before:to-transparent'

/**
 * Author profile loading fallback. Mirrors the author header (avatar + role + name + bio bar)
 * followed by the story grid, so the box is held while the profile resolves.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8" aria-hidden="true">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-start">
        <div className={`${shimmerBase} h-28 w-28 shrink-0 rounded-full`} />
        <div className="flex-1 space-y-3">
          <div className={`${shimmerBase} h-3 w-20 rounded-sm`} />
          <div className={`${shimmerBase} h-7 w-2/3 rounded-sm`} />
          <div className={`${shimmerBase} h-4 w-full rounded-sm`} />
          <div className={`${shimmerBase} h-4 w-5/6 rounded-sm`} />
        </div>
      </header>
      <StoryGridSkeleton count={6} className="mt-8" />
    </div>
  )
}
