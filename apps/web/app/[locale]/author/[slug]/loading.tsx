/** Author soft-navigation state: profile identity followed by the editorial body-of-work rhythm. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-page px-4 py-8" aria-busy="true" aria-label="Loading author">
      <header className="flex flex-col gap-6 border-b border-rule pb-8 sm:flex-row sm:items-start">
        <div className="h-28 w-28 shrink-0 animate-pulse rounded-full bg-rule/55" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-20 animate-pulse bg-rule/55" />
          <div className="h-8 w-2/3 animate-pulse bg-rule/55" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-rule/45" />
          <div className="h-4 w-4/5 max-w-lg animate-pulse bg-rule/45" />
        </div>
      </header>

      <div className="mt-7 border-b border-rule pb-2">
        <div className="h-3 w-16 animate-pulse bg-rule/50" />
        <div className="mt-2 h-7 w-48 animate-pulse bg-rule/55" />
      </div>
      <div className="divide-y divide-rule">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="grid gap-4 py-5 sm:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="aspect-[16/10] animate-pulse bg-rule/45" />
            <div className="space-y-3 py-1">
              <div className="h-3 w-20 animate-pulse bg-rule/45" />
              <div className="h-6 w-11/12 animate-pulse bg-rule/55" />
              <div className="h-6 w-3/4 animate-pulse bg-rule/55" />
              <div className="h-4 w-full animate-pulse bg-rule/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
