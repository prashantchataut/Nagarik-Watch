type Props = {
  rows?: number
  label?: string
}

export function JournalistQueueSkeleton({ rows = 5, label = 'Loading' }: Props) {
  return (
    <main className="newsroom-page" aria-busy="true" aria-label={label}>
      <div className="newsroom-skeleton newsroom-skeleton--title" />
      <div className="newsroom-pulse newsroom-pulse--skeleton" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <div className="newsroom-skeleton newsroom-skeleton--label" />
            <div className="newsroom-skeleton newsroom-skeleton--metric" />
          </div>
        ))}
      </div>
      <div className="newsroom-skeleton-list" aria-hidden="true">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="newsroom-skeleton-row" />
        ))}
      </div>
    </main>
  )
}
