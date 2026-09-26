type RouteSkeletonProps = {
  variant?: 'hub' | 'article' | 'search' | 'admin' | 'home'
  label?: string
}

const shape = 'nw-skeleton rounded-[0.2rem] bg-rule/45'

export function RouteSkeleton({ variant = 'hub', label = 'Loading' }: RouteSkeletonProps) {
  if (variant === 'article') return <ArticleSkeleton label={label} />
  if (variant === 'search') return <SearchSkeleton label={label} />
  if (variant === 'admin') return <AdminSkeleton label={label} />
  if (variant === 'home') return <HomeSkeleton label={label} />
  return <HubSkeleton label={label} />
}

/**
 * The opening package of the portal feed: one centered lead with a wide photo,
 * two supporting features, two picks. Shaped to the real thing so the hand-off
 * is a fill rather than a jump — a skeleton whose geometry does not match what
 * replaces it costs more attention than no skeleton at all.
 */
function HomeSkeleton({ label }: { label: string }) {
  return (
    <div
      className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-6"
      aria-busy="true"
      aria-label={label}
    >
      <div
        className="mx-auto max-w-[68rem] pb-5 pt-3 text-center sm:pb-7 sm:pt-5"
        aria-hidden="true"
      >
        <div className={`${shape} mx-auto h-3 w-24`} />
        <div className={`${shape} mx-auto mt-4 h-10 w-full max-w-[52rem] sm:h-14`} />
        <div className={`${shape} mx-auto mt-3 h-10 w-4/5 max-w-[40rem] sm:h-14`} />
        <div className={`${shape} mx-auto mt-4 h-4 w-full max-w-[34rem]`} />
        <div className={`${shape} mx-auto mt-3 h-3 w-40`} />
      </div>
      <div
        className={`${shape} aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-[2/1]`}
        aria-hidden="true"
      />
      <div
        className="mt-7 grid gap-6 border-b border-rule pb-7 sm:mt-9 sm:pb-9 md:grid-cols-2 md:gap-7"
        aria-hidden="true"
      >
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index}>
            <div className={`${shape} aspect-[16/9] w-full`} />
            <div className={`${shape} mt-3 h-3 w-20`} />
            <div className={`${shape} mt-2 h-6 w-11/12`} />
            <div className={`${shape} mt-2 h-4 w-3/4`} />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-0" aria-hidden="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="border-t border-rule pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:first:border-l-0 sm:first:pl-0"
          >
            <div className={`${shape} h-3 w-16`} />
            <div className={`${shape} mt-2 h-5 w-full`} />
            <div className={`${shape} mt-2 h-4 w-2/3`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function HubSkeleton({ label }: { label: string }) {
  return (
    <div
      className="mx-auto max-w-page px-3 py-5 sm:px-4 sm:py-7"
      aria-busy="true"
      aria-label={label}
    >
      <header className="border-b border-rule pb-4" aria-hidden="true">
        <div className={`${shape} h-3 w-20`} />
        <div className={`${shape} mt-3 h-9 w-56 max-w-[72vw]`} />
        <div className={`${shape} mt-3 h-4 w-full max-w-lg`} />
      </header>
      <div
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.65fr)] lg:gap-8"
        aria-hidden="true"
      >
        <div>
          <div className={`${shape} aspect-[16/9] w-full`} />
          <div className={`${shape} mt-4 h-8 w-11/12`} />
          <div className={`${shape} mt-2 h-4 w-4/5`} />
        </div>
        <div className="divide-y divide-rule border-y border-rule">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="py-4">
              <div className={`${shape} h-5 w-full`} />
              <div className={`${shape} mt-2 h-4 w-3/4`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ArticleSkeleton({ label }: { label: string }) {
  return (
    <article
      className="mx-auto max-w-page px-3 py-5 sm:px-4 sm:py-7"
      aria-busy="true"
      aria-label={label}
    >
      <header className="mx-auto max-w-[72rem]" aria-hidden="true">
        <div className={`${shape} h-3 w-24`} />
        <div className={`${shape} mt-4 h-12 w-full sm:h-16`} />
        <div className={`${shape} mt-2 h-12 w-4/5 sm:h-16`} />
        <div className={`${shape} mt-4 h-5 w-2/3`} />
        <div className="mt-5 flex gap-3">
          <div className={`${shape} h-4 w-28`} />
          <div className={`${shape} h-4 w-20`} />
        </div>
      </header>
      <div className={`${shape} mx-auto mt-6 aspect-video max-w-[72rem]`} aria-hidden="true" />
      <div className="mx-auto mt-7 max-w-[72ch] space-y-3" aria-hidden="true">
        {[100, 100, 92, 100, 84, 96, 72].map((width, index) => (
          <div key={index} className={`${shape} h-4`} style={{ width: `${width}%` }} />
        ))}
      </div>
    </article>
  )
}

function SearchSkeleton({ label }: { label: string }) {
  return (
    <div
      className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8"
      aria-busy="true"
      aria-label={label}
    >
      <div className="border-b border-rule pb-5" aria-hidden="true">
        <div className={`${shape} h-9 w-44`} />
        <div className={`${shape} mt-3 h-4 w-full max-w-lg`} />
      </div>
      <div className={`${shape} mt-6 h-12 w-full max-w-2xl`} aria-hidden="true" />
      <div className="mt-5 divide-y divide-rule border-y border-rule" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid gap-3 py-4 sm:grid-cols-[1fr_8rem] sm:items-center">
            <div>
              <div className={`${shape} h-5 w-11/12`} />
              <div className={`${shape} mt-2 h-4 w-3/4`} />
            </div>
            <div className={`${shape} hidden aspect-[4/3] sm:block`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-label={label}>
      <div className="border-b border-rule pb-4" aria-hidden="true">
        <div className={`${shape} h-7 w-48`} />
        <div className={`${shape} mt-2 h-3 w-64 max-w-full`} />
      </div>
      <div className="grid gap-3 md:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="border border-rule bg-surface-raised p-4">
            <div className={`${shape} h-3 w-20`} />
            <div className={`${shape} mt-3 h-7 w-24`} />
          </div>
        ))}
      </div>
      <div className="border border-rule bg-surface-raised p-4" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-rule py-3 last:border-b-0"
          >
            <div className={`${shape} h-4 w-1/2`} />
            <div className={`${shape} ml-auto h-4 w-24`} />
          </div>
        ))}
      </div>
    </div>
  )
}
