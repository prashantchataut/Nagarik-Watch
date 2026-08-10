export default function UtilitiesLoading() {
  return (
    <div
      className="mx-auto max-w-page space-y-6 px-4 py-8 sm:py-12"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-8 w-48 animate-pulse rounded bg-rule/50" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-rule/40" />
      <div className="min-h-[22rem] animate-pulse border border-rule bg-surface-raised" />
    </div>
  )
}
