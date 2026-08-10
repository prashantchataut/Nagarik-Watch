export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-page space-y-4 px-4 py-8" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-full max-w-xl animate-pulse rounded-md bg-rule/50" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-md border border-rule bg-surface-raised"
          />
        ))}
      </div>
    </div>
  )
}
