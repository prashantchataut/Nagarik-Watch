export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8" aria-busy="true" aria-label="Loading search">
      <div className="border-b border-rule pb-4">
        <div className="h-8 w-44 animate-pulse bg-rule/55" />
        <div className="mt-3 h-4 w-full max-w-lg animate-pulse bg-rule/40" />
      </div>
      <div className="mt-6 h-12 w-full max-w-2xl animate-pulse border border-rule bg-surface-raised" />
      <div className="mt-5 divide-y divide-rule border-y border-rule">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-3 py-4 sm:grid-cols-[1fr_8rem] sm:items-center">
            <div className="space-y-2">
              <div className="h-5 w-11/12 animate-pulse bg-rule/50" />
              <div className="h-4 w-3/4 animate-pulse bg-rule/40" />
            </div>
            <div className="hidden aspect-[4/3] animate-pulse bg-rule/40 sm:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
