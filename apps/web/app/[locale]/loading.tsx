import { StoryGridSkeleton } from '@nagarikwatch/ui'

/**
 * Topic listing loading fallback. Mirrors the topic page shell so the grid holds its box
 * while the page resolves.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8" aria-hidden="true">
      <StoryGridSkeleton count={6} />
    </div>
  )
}
