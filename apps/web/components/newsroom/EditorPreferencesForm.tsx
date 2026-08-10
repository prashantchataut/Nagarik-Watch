'use client'

import { useState, useTransition } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import type { EditorPreferences } from '@/lib/editor-preferences-types'

type Props = {
  locale: Locale
  initial: EditorPreferences
  categories: Category[]
  variant?: 'admin' | 'journalist'
}

export function EditorPreferencesForm({
  locale,
  initial,
  categories,
  variant = 'journalist',
}: Props) {
  const ne = locale === 'ne'
  const [prefs, setPrefs] = useState(initial)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save() {
    setStatus(null)
    startTransition(() => {
      void (async () => {
        const res = await fetch('/api/newsroom/editor-preferences', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            defaultCategorySlug: prefs.defaultCategorySlug,
            autosaveSeconds: prefs.autosaveSeconds,
            density: prefs.density,
            showFormattingHints: prefs.showFormattingHints,
            preferredLocale: prefs.preferredLocale,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          error?: string
          preferences?: EditorPreferences
        }
        if (!res.ok) {
          setStatus(data.error ?? (ne ? 'सुरक्षित गर्न सकिएन।' : 'Could not save.'))
          return
        }
        if (data.preferences) setPrefs(data.preferences)
        setStatus(ne ? 'प्राथमिकता सुरक्षित भयो।' : 'Preferences saved.')
      })()
    })
  }

  return (
    <section className={`editor-prefs editor-prefs--${variant}`}>
      <header>
        <h2>{ne ? 'सम्पादक प्राथमिकता' : 'Editor preferences'}</h2>
        <p>
          {ne
            ? 'यी सेटिङहरू तपाईंको न्युजरुम खातासँग जोडिन्छन्, पत्रकार डेस्क र एडमिन सम्पादक दुवैमा।'
            : 'These settings follow your newsroom account across the journalist desk and admin editor.'}
        </p>
      </header>

      <div className="editor-prefs__grid">
        <label>
          <span>{ne ? 'पूर्वनिर्धारित विभाग' : 'Default category'}</span>
          <select
            value={prefs.defaultCategorySlug}
            onChange={(event) =>
              setPrefs((current) => ({
                ...current,
                defaultCategorySlug: event.target.value,
              }))
            }
          >
            <option value="">{ne ? 'छैन (हातले छान्नुहोस्)' : 'None (pick each time)'}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {locale === 'en' && category.nameEn ? category.nameEn : category.nameNe}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{ne ? 'स्वतः सुरक्षित (सेकेन्ड)' : 'Autosave interval (seconds)'}</span>
          <input
            type="number"
            min={10}
            max={300}
            step={5}
            value={prefs.autosaveSeconds}
            onChange={(event) =>
              setPrefs((current) => ({
                ...current,
                autosaveSeconds: Number(event.target.value) || 30,
              }))
            }
          />
        </label>

        <label>
          <span>{ne ? 'घनत्व' : 'Density'}</span>
          <select
            value={prefs.density}
            onChange={(event) =>
              setPrefs((current) => ({
                ...current,
                density: event.target.value === 'compact' ? 'compact' : 'comfortable',
              }))
            }
          >
            <option value="comfortable">{ne ? 'आरामदायी' : 'Comfortable'}</option>
            <option value="compact">{ne ? 'सघन' : 'Compact'}</option>
          </select>
        </label>

        <label>
          <span>{ne ? 'UI भाषा प्राथमिकता' : 'UI language preference'}</span>
          <select
            value={prefs.preferredLocale}
            onChange={(event) => {
              const value = event.target.value
              setPrefs((current) => ({
                ...current,
                preferredLocale:
                  value === 'ne' || value === 'en' || value === 'follow' ? value : 'follow',
              }))
            }}
          >
            <option value="follow">{ne ? 'मार्ग URL अनुसार' : 'Follow URL locale'}</option>
            <option value="ne">नेपाली</option>
            <option value="en">English</option>
          </select>
        </label>

        <label className="editor-prefs__check">
          <input
            type="checkbox"
            checked={prefs.showFormattingHints}
            onChange={(event) =>
              setPrefs((current) => ({
                ...current,
                showFormattingHints: event.target.checked,
              }))
            }
          />
          <span>{ne ? 'ढाँचा hint देखाउनुहोस्' : 'Show formatting hints'}</span>
        </label>
      </div>

      <div className="editor-prefs__actions">
        <button type="button" onClick={save} disabled={pending}>
          {pending
            ? ne
              ? 'सुरक्षित हुँदै…'
              : 'Saving…'
            : ne
              ? 'सुरक्षित गर्नुहोस्'
              : 'Save preferences'}
        </button>
        {status ? <p role="status">{status}</p> : null}
      </div>
    </section>
  )
}
