'use client'

/**
 * Editor extras — लन्च चेक (Launch Check) panel + विज्ञापन (Ads) manager.
 * Shown in the editor desk right rail.
 */

import { useCallback, useEffect, useState } from 'react'
import { Rocket, CheckCircle2, AlertTriangle, CircleHelp, KeyRound, Plus, Megaphone, Trash2 } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/news/api-client'
import { toDevanagari } from '@/lib/news/patro'

/* ------------------------------ Launch check ----------------------------- */

interface LaunchCheck {
  key: string
  labelNe: string
  group: string
  weight: number
  status: 'pass' | 'warn' | 'fail' | 'operator'
  detailNe: string
}

interface LaunchData {
  score: number
  summary: {
    pass: number
    warn: number
    fail: number
    operator: number
    passedWeight: number
    totalWeight: number
    nextActionsNe: string[]
  }
  checks: LaunchCheck[]
}

const GROUP_LABELS: Record<string, string> = {
  platform: 'प्लेटफर्म',
  content: 'सामग्री',
  seo: 'एसईओ',
  newsroom: 'समाचार कक्ष',
  revenue: 'आम्दानी',
  operator: 'सञ्चालकको काम',
}

const STATUS_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: AlertTriangle,
  operator: KeyRound,
} as const

const STATUS_COLOR = {
  pass: 'text-green',
  warn: 'text-gold',
  fail: 'text-crimson',
  operator: 'text-ink-soft',
} as const

export function LaunchCheckPanel() {
  const [data, setData] = useState<LaunchData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    void apiGet<LaunchData & { ok: boolean }>('/api/launch-check')
      .then((d) => setData(d))
      .catch((err) => setError(err instanceof Error ? err.message : 'लन्च चेक लोड गर्न सकिएन।'))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(load, 0)
    return () => window.clearTimeout(t)
  }, [load])

  return (
    <div className="paper-card rounded-sm p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
          <Rocket className="size-4 text-crimson" /> लन्च चेक
        </p>
        {data && (
          <span
            className={`rounded-sm px-2.5 py-1 font-headline text-[16px] font-black ${
              data.score >= 90 ? 'bg-green/10 text-green' : data.score >= 70 ? 'bg-gold/10 text-gold' : 'bg-crimson/10 text-crimson'
            }`}
          >
            {toDevanagari(data.score)}%
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-[13px] font-bold text-crimson">{error}</p>}
      {!data && !error && <p className="mt-3 text-[13px] text-ink-faint">प्रोब चलिरहेको छ…</p>}

      {data && (
        <>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">
            इन-रेपो विशेषता प्रोबहरू + सञ्चालकका परिवेश चरहरू। अन्तिम{' '}
            {toDevanagari(data.summary.operator)} अंश कोडले होइन, तपाईंको सेटअपले पूरा गर्छ।
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-rule">
            <div
              className="h-full rounded-full bg-gradient-to-r from-crimson to-green transition-all"
              style={{ width: `${data.score}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            उत्तीर्ण {toDevanagari(data.summary.pass)} · चेतावनी {toDevanagari(data.summary.warn)} · असफल{' '}
            {toDevanagari(data.summary.fail)} · सञ्चालक {toDevanagari(data.summary.operator)}
          </p>

          <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {data.checks.map((c) => {
              const Icon = STATUS_ICON[c.status] ?? CircleHelp
              const color = STATUS_COLOR[c.status] ?? 'text-ink-soft'
              return (
                <li key={c.key} className="flex items-start gap-2 text-[12.5px] leading-snug">
                  <Icon className={`mt-0.5 size-3.5 shrink-0 ${color}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="font-bold text-ink">{c.labelNe}</span>
                    <span className="text-ink-faint"> · {GROUP_LABELS[c.group] ?? c.group}</span>
                    <span className="block text-[11.5px] text-ink-soft">{c.detailNe}</span>
                  </span>
                  <span className="shrink-0 font-headline text-[11px] font-bold text-ink-faint">
                    {toDevanagari(c.weight)}
                  </span>
                </li>
              )
            })}
          </ul>

          {data.summary.nextActionsNe.length > 0 && (
            <div className="mt-3 rounded-sm border border-crimson/40 bg-crimson/5 p-3">
              <p className="font-headline text-[12.5px] font-bold text-crimson">बाँकी काम (अन्तिम अंश):</p>
              <ul className="mt-1.5 space-y-1">
                {data.summary.nextActionsNe.map((a) => (
                  <li key={a} className="text-[12px] leading-relaxed text-ink-soft">
                    — {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ------------------------------- Ads manager ------------------------------ */

interface Campaign {
  id: string
  name: string
  placement: string
  title: string
  body: string | null
  ctaLabel: string | null
  link: string | null
  image: string | null
  accent: string
  active: boolean
  priority: number
  impressions: number
  clicks: number
}

const PLACEMENT_LABELS: Record<string, string> = {
  leaderboard: 'लिडरबोर्ड (गृह शीर्ष)',
  infeed: 'फिडमा (हरेक ९ कथा)',
  sidebar: 'साइडबार',
  article_inline: 'लेख भित्र',
}

export function AdsManagerPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    placement: 'leaderboard',
    title: '',
    body: '',
    ctaLabel: '',
    link: '',
  })

  const load = useCallback(() => {
    void apiGet<{ campaigns: Campaign[] }>('/api/ads/campaigns')
      .then((d) => setCampaigns(d.campaigns))
      .catch((err) => setError(err instanceof Error ? err.message : 'क्याम्पेन लोड गर्न सकिएन।'))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(load, 0)
    return () => window.clearTimeout(t)
  }, [load])

  async function toggle(c: Campaign) {
    setBusy(true)
    try {
      await fetch('/api/ads/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: Campaign) {
    setBusy(true)
    try {
      await fetch('/api/ads/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, delete: true }),
      })
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/ads/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'सिर्जना गर्न सकिएन।')
      setForm({ name: '', placement: 'leaderboard', title: '', body: '', ctaLabel: '', link: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'सिर्जना असफल।')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="paper-card rounded-sm p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-headline text-[15px] font-extrabold text-ink">
          <Megaphone className="size-4 text-crimson" /> विज्ञापन क्याम्पेन
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1.5 font-headline text-[12px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
        >
          <Plus className="size-3.5" /> नयाँ
        </button>
      </div>

      {error && <p className="mt-2 text-[13px] font-bold text-crimson">{error}</p>}

      {showForm && (
        <form onSubmit={create} className="mt-3 space-y-2 rounded-sm border border-rule bg-paper p-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="क्याम्पेन नाम (भित्री)"
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
            required
          />
          <select
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value })}
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
          >
            {Object.entries(PLACEMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="विज्ञापन शीर्षक (नेपाली)"
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
            required
          />
          <input
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="विवरण (नेपाली)"
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
          />
          <input
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
            placeholder="बटन पाठ (जस्तै: जानकारी लिनुहोस्)"
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
          />
          <input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="लिङ्क https://…"
            className="w-full rounded-sm border border-rule bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-crimson focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-sm bg-crimson px-4 py-1.5 font-headline text-[13px] font-bold text-white hover:bg-crimson-deep disabled:opacity-60"
          >
            {busy ? '…' : 'सिर्जना गर्नुहोस्'}
          </button>
        </form>
      )}

      {!campaigns && <p className="mt-3 text-[13px] text-ink-faint">लोड हुँदै…</p>}
      {campaigns && campaigns.length === 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
          क्याम्पेन छैन — पाठकले हाउस-विज्ञापन (आन्तरिक प्रवर्धन) देख्छन्। नयाँ थिचेर सिर्जना गर्नुहोस्।
        </p>
      )}
      {campaigns && campaigns.length > 0 && (
        <ul className="mt-3 space-y-2">
          {campaigns.map((c) => {
            const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0
            return (
              <li key={c.id} className="rounded-sm border border-rule bg-paper p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-headline text-[13.5px] font-bold text-ink">{c.name}</p>
                    <p className="text-[11.5px] text-ink-faint">
                      {PLACEMENT_LABELS[c.placement] ?? c.placement} · {c.title}
                    </p>
                    <p className="mt-1 text-[11.5px] text-ink-soft">
                      देखियो {toDevanagari(c.impressions)} · थिचियो {toDevanagari(c.clicks)} · CTR{' '}
                      {toDevanagari(ctr.toFixed(1))}%
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => void toggle(c)}
                      disabled={busy}
                      className={`rounded-sm px-2.5 py-1 font-headline text-[11.5px] font-bold ${
                        c.active ? 'bg-green/10 text-green' : 'bg-rule/60 text-ink-soft'
                      }`}
                    >
                      {c.active ? 'सक्रिय' : 'बन्द'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(c)}
                      disabled={busy}
                      aria-label="मेट्नुहोस्"
                      className="rounded-sm p-1 text-ink-faint hover:text-crimson"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
