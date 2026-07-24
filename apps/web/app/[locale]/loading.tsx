export default function LocaleLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-16" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse bg-brand-tint" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full max-w-xl animate-pulse bg-rule" />
        <div className="h-4 w-full max-w-lg animate-pulse bg-rule" />
        <div className="h-4 w-full max-w-md animate-pulse bg-rule" />
      </div>
    </div>
  )
}
