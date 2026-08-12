'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useState, type FormEvent } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { cn } from '@nagarikwatch/ui'
import { OverlayDialog } from '@/components/overlays/OverlayDialog'
import { IconClose, IconSearch } from '@/components/icons/PortalIcons'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

type SearchLauncherProps = {
  locale: Locale
  className?: string
  iconSize?: number
}

export function SearchLauncher({ locale, className, iconSize = 18 }: SearchLauncherProps) {
  const dict = getDictionary(locale)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dialogId = useId()
  const titleId = useId()
  const descriptionId = useId()
  const searchHref = localizeHref(locale, '/search')
  const latestHref = localizeHref(locale, '/latest')
  const factCheckHref = localizeHref(locale, '/fact-check')
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    setOpen(false)
    router.push(trimmed ? `${searchHref}?q=${encodeURIComponent(trimmed)}` : searchHref)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.search}
        aria-expanded={open}
        aria-controls={dialogId}
        className={cn(
          'inline-flex h-11 w-11 items-center justify-center rounded border border-transparent text-on-chrome-soft transition-colors duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised/70 hover:text-on-chrome focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          className,
        )}
      >
        <IconSearch width={iconSize} height={iconSize} />
      </button>

      <OverlayDialog
        id={dialogId}
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        describedBy={descriptionId}
        variant="search"
      >
        <form onSubmit={submit} className="flex max-h-[min(82dvh,38rem)] flex-col" lang={lang}>
          <div className="flex items-start justify-between gap-4 border-b border-rule px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-h2 font-extrabold text-ink">
                {dict.search}
              </h2>
              <p id={descriptionId} className="mt-1 text-meta leading-relaxed text-ink-soft">
                {en
                  ? 'Search stories, authors and topics. Nepali and English queries are supported.'
                  : 'समाचार, लेखक र विषय खोज्नुहोस्। नेपाली र अंग्रेजी दुवै खोज समर्थित छन्।'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={en ? 'Close search' : 'खोज बन्द गर्नुहोस्'}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded border border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <IconClose width={19} height={19} />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <label htmlFor={`${dialogId}-query`} className="sr-only">
              {dict.searchAria}
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <IconSearch
                  width={19}
                  height={19}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
                />
                <input
                  id={`${dialogId}-query`}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  autoFocus
                  autoComplete="off"
                  placeholder={dict.searchPlaceholder}
                  className="min-h-12 w-full rounded border border-rule bg-surface-raised py-2.5 pl-11 pr-3 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded border border-brand bg-brand px-5 text-meta font-extrabold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {en ? 'Search' : 'खोज्नुहोस्'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule pt-4 text-meta font-semibold text-ink-soft">
              <Link
                href={latestHref}
                onClick={() => setOpen(false)}
                className="hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {en ? 'Latest news' : 'ताजा समाचार'}
              </Link>
              <Link
                href={factCheckHref}
                onClick={() => setOpen(false)}
                className="hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {en ? 'Fact check' : 'तथ्य-जाँच'}
              </Link>
              <Link
                href={searchHref}
                onClick={() => setOpen(false)}
                className="text-brand-strong underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:ml-auto"
              >
                {en ? 'Open search page' : 'खोज पृष्ठ खोल्नुहोस्'}
              </Link>
            </div>
          </div>
        </form>
      </OverlayDialog>
    </>
  )
}
