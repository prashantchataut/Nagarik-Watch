/** Article soft-navigation state: headline, hero plane and reading column mirror the real page. */
export default function Loading() {
  return (
    <article
      className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5"
      aria-busy="true"
      aria-label="Loading article"
    >
      <header className="mx-auto max-w-[72rem]">
        <div className="h-3 w-24 animate-pulse bg-rule/45" />
        <div className="mt-4 h-12 w-full animate-pulse bg-rule/55 sm:h-16" />
        <div className="mt-2 h-12 w-4/5 animate-pulse bg-rule/55 sm:h-16" />
        <div className="mt-4 h-5 w-2/3 animate-pulse bg-rule/40" />
        <div className="mt-5 flex gap-3">
          <div className="h-4 w-28 animate-pulse bg-rule/40" />
          <div className="h-4 w-20 animate-pulse bg-rule/40" />
        </div>
      </header>
      <div className="mx-auto mt-5 aspect-video max-w-[72rem] animate-pulse bg-rule/45" />
      <div className="mx-auto mt-6 max-w-[72ch] space-y-3">
        <div className="h-4 w-full animate-pulse bg-rule/40" />
        <div className="h-4 w-full animate-pulse bg-rule/40" />
        <div className="h-4 w-11/12 animate-pulse bg-rule/40" />
        <div className="h-4 w-full animate-pulse bg-rule/40" />
        <div className="h-4 w-4/5 animate-pulse bg-rule/40" />
      </div>
    </article>
  )
}
