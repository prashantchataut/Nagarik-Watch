'use client'

import { useEffect, useState } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { CONSENT_EVENT, getOrCreateReaderId, hasPersonalizationConsent, mergeConsent } from '@/lib/reader/consent'
import { readLocalReaderPreferences, writeLocalReaderPreferences } from '@/lib/reader/preferences'
import type { ReaderPreferences } from '@/lib/reader/preferences-store'

const ONBOARDING_KEY = 'nw:reader-topic-onboarding:v1'

export function ReaderTopicOnboarding({ locale, categories }: { locale: Locale; categories: Category[] }) {
  const [visible, setVisible] = useState(false)
  const [consented, setConsented] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const english = locale === 'en'

  useEffect(() => {
    const refresh = () => {
      setConsented(hasPersonalizationConsent())
      setVisible(localStorage.getItem(ONBOARDING_KEY) !== 'done')
    }
    refresh()
    window.addEventListener(CONSENT_EVENT, refresh)
    return () => window.removeEventListener(CONSENT_EVENT, refresh)
  }, [])

  function close() {
    localStorage.setItem(ONBOARDING_KEY, 'done')
    setVisible(false)
  }

  async function save() {
    if (selected.length === 0) return
    const current: ReaderPreferences = readLocalReaderPreferences() ?? {
      categories: [], tags: [], authors: [], provinces: [],
      breaking: true, followedTopics: true, followedAuthors: true,
      dailyDigest: false, browserAlerts: false, quietStart: 22, quietEnd: 7,
      timeZone: 'Asia/Kathmandu', updatedAt: new Date(0).toISOString(),
    }
    const next = { ...current, categories: [...new Set([...current.categories, ...selected])], updatedAt: new Date().toISOString() }
    writeLocalReaderPreferences(next)
    close()
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fingerprint: getOrCreateReaderId(), ...next }),
    }).catch(() => undefined)
  }

  if (!visible) return null

  return (
    <section className="reader-onboarding" aria-labelledby="reader-onboarding-title">
      <div>
        <p className="editorial-kicker" lang="en">First visit</p>
        <h2 id="reader-onboarding-title">{english ? 'Choose a few useful desks' : 'आफूलाई उपयोगी केही विभाग छान्नुहोस्'}</h2>
        <p>{english ? 'Your choices shape recommendations and can be changed any time.' : 'यी छनोटले सिफारिस मिलाउँछन् र जुनसुकै बेला बदल्न सकिन्छ।'}</p>
      </div>
      {consented ? (
        <>
          <div className="reader-onboarding__topics">
            {categories.slice(0, 8).map((category) => {
              const active = selected.includes(category.slug)
              return (
                <button key={category.slug} type="button" aria-pressed={active} onClick={() => setSelected((current) => active ? current.filter((item) => item !== category.slug) : [...current, category.slug])}>
                  {english ? category.nameEn || category.nameNe : category.nameNe}
                </button>
              )
            })}
          </div>
          <button type="button" className="text-action" disabled={selected.length === 0} onClick={() => void save()}>
            {english ? 'Save topics' : 'विषय सुरक्षित गर्नुहोस्'}
          </button>
        </>
      ) : (
        <button type="button" className="text-action" onClick={() => mergeConsent({ personalization: true })}>
          {english ? 'Allow personalization to choose topics' : 'विषय छान्न व्यक्तिगत अनुभव अनुमति दिनुहोस्'}
        </button>
      )}
      <button type="button" className="reader-onboarding__skip" onClick={close}>
        {english ? 'Skip' : 'छोड्नुहोस्'}
      </button>
    </section>
  )
}
