'use client'

import { useEffect, useRef, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { LIVE_PLACES, type LivePlace } from '@/lib/live/places'
import { detectPlaceFromGeolocation, readLocalPlace, writeLocalPlace } from '@/lib/reader/place'

type PlaceCityPickerProps = {
  locale: Locale
  place: LivePlace
  onPlaceChange: (place: LivePlace, chosen: boolean) => void
  compact?: boolean
}

export function PlaceCityPicker({
  locale,
  place,
  onPlaceChange,
  compact = false,
}: PlaceCityPickerProps) {
  const en = locale === 'en'
  const [open, setOpen] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectError, setDetectError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  const label = en ? place.placeEn : place.placeNe

  const selectPlace = (slug: string) => {
    writeLocalPlace(slug)
    const next = readLocalPlace()
    onPlaceChange(next, true)
    setOpen(false)
    setDetectError(null)
  }

  const detect = async () => {
    setDetecting(true)
    setDetectError(null)
    try {
      const detected = await detectPlaceFromGeolocation()
      writeLocalPlace(detected.slug)
      onPlaceChange(detected, true)
      setOpen(false)
    } catch {
      setDetectError(
        en
          ? 'Location unavailable. Pick a city below.'
          : 'स्थान पत्ता लागेन। तलबाट सहर छान्नुहोस्।',
      )
    } finally {
      setDetecting(false)
    }
  }

  return (
    <div ref={panelRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={
          compact
            ? 'inline-flex items-center gap-1 rounded border border-rule bg-surface px-2 py-0.5 text-caption font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-tint/30'
            : 'inline-flex items-center gap-2 rounded border border-rule bg-surface px-3 py-2 text-body-sm font-semibold text-ink transition-colors hover:border-brand hover:bg-brand-tint/25'
        }
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        <span className="text-ink-soft" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          className={
            compact
              ? 'absolute left-0 top-full z-50 mt-1 w-[min(100vw-1.5rem,18rem)] rounded border border-rule bg-surface-raised p-3 shadow-md'
              : 'mt-3 rounded border border-rule bg-surface-raised p-4'
          }
          role="listbox"
          aria-label={en ? 'Choose city' : 'सहर छान्नुहोस्'}
        >
          <button
            type="button"
            onClick={() => void detect()}
            disabled={detecting}
            className="mb-3 w-full rounded border border-brand/40 bg-brand-tint/35 px-3 py-2 text-caption font-bold text-brand-strong transition-colors hover:bg-brand-tint/55 disabled:opacity-60"
          >
            {detecting
              ? en
                ? 'Detecting…'
                : 'पत्ता लगाउँदै…'
              : en
                ? 'Use my location'
                : 'मेरो स्थान प्रयोग गर्नुहोस्'}
          </button>
          {detectError ? <p className="mb-2 text-caption text-ink-soft">{detectError}</p> : null}
          <p className="mb-2 text-caption text-ink-soft">{en ? 'Nepal cities' : 'नेपालका सहर'}</p>
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {LIVE_PLACES.map((item) => {
              const active = item.slug === place.slug
              const itemLabel = en ? item.placeEn : item.placeNe
              return (
                <li key={item.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectPlace(item.slug)}
                    className={
                      active
                        ? 'w-full rounded bg-brand-tint/50 px-2 py-1.5 text-left text-caption font-bold text-brand-strong'
                        : 'w-full rounded px-2 py-1.5 text-left text-caption text-ink transition-colors hover:bg-surface'
                    }
                  >
                    {itemLabel}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
