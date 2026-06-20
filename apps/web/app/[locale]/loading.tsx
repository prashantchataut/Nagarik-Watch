import { StoryGridSkeleton } from '@nagarikwatch/ui'

/**
 * Homepage loading fallback. Matches the homepage shell: a centered max-w-page column with
 * a six-card grid so the box is held while the server resolves the homepage payload.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8" aria-hidden="true">
      <StoryGridSkeleton count={6} />
    </div>
  )
}
