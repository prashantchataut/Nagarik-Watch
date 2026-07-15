export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded bg-rule/60" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-md border border-rule bg-surface-raised" />
        ))}
      </div>
      <div className="h-64 rounded-md border border-rule bg-surface-raised" />
    </div>
  )
}
