'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Eye,
  FileText,
  Loader2,
  LogOut,
  PenLine,
  Save,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react'
import { desks, stories, type Block } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import { initialOf, journalistLogin, logout, useMe } from '@/lib/news/auth-store'
import { toDevanagari, formatBsFull, adToBs } from '@/lib/news/patro'
import { blocksToMarkdown, parseBodyBlocks, wordCount, readingMinutesOf } from '@/lib/blocks'
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/news/api-client'
import { refreshArticles } from '@/lib/news/article-store'
import EditorDashboard from './EditorDashboard'

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/15'

interface Pitch {
  id: string
  headline: string
  desk: string
  summary: string
  status: string
  editorNote: string | null
  createdAt: string
}

interface MyArticle {
  slug: string
  desk: string
  titleNe: string
  deckNe: string
  status: string
  editorNote: string | null
  publishedAt: string | null
  updatedAt: string
  views: number
}

const STATUS_NE: Record<string, string> = {
  draft: 'ड्राफ्ट',
  submitted: 'समीक्षामा',
  published: 'प्रकाशित',
  declined: 'अस्वीकार',
}

const STATUS_CLASS: Record<string, string> = {
  draft: 'bg-ink/10 text-ink-soft',
  submitted: 'bg-gold/20 text-[#8a6d1a]',
  published: 'bg-market-green/15 text-market-green',
  declined: 'bg-crimson-wash text-crimson',
}

type Tab = 'pitch' | 'editor' | 'mine' | 'editorDesk'

interface DraftForm {
  desk: string
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  bodyNe: string
  bodyEn: string
  hero: string
  tags: string
}

const EMPTY_DRAFT: DraftForm = {
  desk: 'politics',
  titleNe: '',
  titleEn: '',
  deckNe: '',
  deckEn: '',
  bodyNe: '',
  bodyEn: '',
  hero: '',
  tags: '',
}

/** Journalist login + full newsroom desk (#/journalist).
 *  Completely separate from reader accounts, per the newsroom's policy.
 *  Reporters: pitches + article pipeline. Editors: also the सम्पादक dashboard. */
export default function JournalistView() {
  const { me } = useMe()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [tab, setTab] = useState<Tab>('pitch')
  const [pitches, setPitches] = useState<Pitch[] | null>(null)
  const [deskOverride, setDeskOverride] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [pitchBody, setPitchBody] = useState('')
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // article editor state
  const [draft, setDraft] = useState<DraftForm>(EMPTY_DRAFT)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editorMsg, setEditorMsg] = useState<string | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [myArticles, setMyArticles] = useState<MyArticle[] | null>(null)

  const isJournalist = me?.kind === 'journalist'
  const isEditor = isJournalist && me.role === 'editor'
  const desk = deskOverride ?? (me?.kind === 'journalist' ? me.desk : 'politics')

  const loadPitches = useCallback(async () => {
    try {
      const json = await apiGet<{ pitches: Pitch[] }>('/api/desk/pitches')
      setPitches(json.pitches)
    } catch {
      setPitches([])
    }
  }, [])

  const loadMine = useCallback(async () => {
    try {
      const json = await apiGet<{ articles: MyArticle[] }>('/api/articles/mine')
      setMyArticles(json.articles)
    } catch {
      setMyArticles([])
    }
  }, [])

  useEffect(() => {
    if (!isJournalist) return
    void loadPitches()
    void loadMine()
  }, [isJournalist, loadPitches, loadMine])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await journalistLogin(email, password)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'त्रुटि भयो।')
    } finally {
      setBusy(false)
    }
  }

  const submitPitch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMsg(null)
    setSubmitting(true)
    try {
      await apiPost('/api/desk/pitches', { headline, desk, summary, body: pitchBody })
      setSubmitMsg('पिच सम्पादकीय डेस्कमा पुग्यो — धन्यवाद!')
      setHeadline('')
      setSummary('')
      setPitchBody('')
      await loadPitches()
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : 'पठाउन सकिएन।')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- article editor actions ---------------- */

  const parsedPreview = useMemo(() => parseBodyBlocks(draft.bodyNe), [draft.bodyNe])
  const previewWords = useMemo(() => wordCount(parsedPreview), [parsedPreview])

  const saveDraft = async (submit: boolean) => {
    setEditorMsg(null)
    setEditorError(null)
    setSaving(true)
    const payload = {
      desk: draft.desk,
      titleNe: draft.titleNe,
      titleEn: draft.titleEn,
      deckNe: draft.deckNe,
      deckEn: draft.deckEn,
      bodyNe: draft.bodyNe,
      bodyEn: draft.bodyEn,
      hero: draft.hero,
      tags: draft.tags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8),
      submit,
    }
    try {
      if (editingSlug) {
        await apiPatch(`/api/articles/${editingSlug}`, payload)
        if (submit) {
          await apiPatch(`/api/articles/${editingSlug}`, { action: 'submit' })
        }
        setEditorMsg(submit ? 'समाचार सम्पादकीय समीक्षामा पठाइयो।' : 'परिवर्तन सुरक्षित भयो।')
      } else {
        await apiPost('/api/articles', payload)
        setEditorMsg(submit ? 'समाचार सम्पादकीय समीक्षामा पठाइयो।' : 'ड्राफ्ट सुरक्षित भयो।')
        setDraft(EMPTY_DRAFT)
      }
      await loadMine()
      await refreshArticles(true)
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'सुरक्षित गर्न सकिएन।')
    } finally {
      setSaving(false)
    }
  }

  const loadForEdit = async (slug: string) => {
    setEditorError(null)
    try {
      const json = await apiGet<{ article: { bodyNe: Block[] } & Record<string, unknown> }>(
        `/api/articles/${slug}`,
      )
      const a = json.article
      setDraft({
        desk: String(a.desk ?? 'politics'),
        titleNe: String(a.titleNe ?? ''),
        titleEn: String((a.titleEn as string) ?? ''),
        deckNe: String(a.deckNe ?? ''),
        deckEn: String((a.deckEn as string) ?? ''),
        bodyNe: blocksToMarkdown(a.bodyNe ?? []),
        bodyEn: a.bodyEn ? blocksToMarkdown(a.bodyEn as Block[]) : '',
        hero: String(a.hero ?? ''),
        tags: Array.isArray(a.tags) ? (a.tags as string[]).join(', ') : '',
      })
      setEditingSlug(slug)
      setEditorMsg(null)
      setTab('editor')
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'लोड गर्न सकिएन।')
    }
  }

  const articleAction = async (slug: string, action: 'submit' | 'retract' | 'delete') => {
    setEditorError(null)
    try {
      if (action === 'delete') {
        await apiDelete(`/api/articles/${slug}`)
      } else {
        await apiPatch(`/api/articles/${slug}`, { action })
      }
      await loadMine()
      await refreshArticles(true)
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'कार्य असफल भयो।')
    }
  }

  const todayBs = formatBsFull(adToBs(new Date()))

  /* ---------------- login screen ---------------- */
  if (!isJournalist) {
    return (
      <main id="main">
        <div className="crimson-band no-print">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-2.5">
            <p className="font-headline text-[14px] font-bold text-white">
              नागरिक वाच समाचार कक्ष · पत्रकार प्रवेश
            </p>
            <a href={href('/')} className="font-headline text-[13px] font-semibold text-white/90 hover:text-white">
              गृहपृष्ठ →
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1180px] px-4">
          <div className="grid gap-x-10 gap-y-8 py-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="kicker">समाचार कक्ष</p>
              <h1 className="mt-1.5 font-headline text-[clamp(30px,4.6vw,44px)] font-extrabold leading-tight text-ink">
                पत्रकार लगइन
              </h1>
              <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-soft">
                यो प्रवेश पाठक खाताभन्दा पूर्ण रूपमा छुट्टै छ। पत्रकारले लगइन गरेपछि आफ्नो डेस्कका
                सामग्री हेर्न, नयाँ पिच र पूरा समाचार पठाउन तथा सम्पादकीय प्रतिक्रिया अनुगमन गर्न
                सक्नुहुन्छ। सम्पादकहरूले प्रकाशन, तत्काल समाचार र विश्लेषण डेस्कबाटै व्यवस्थापन
                गर्न सक्छन्।
              </p>
              <div className="paper-card mt-6 rounded-sm p-5">
                <p className="font-headline text-[15px] font-extrabold text-ink">डेमो खाता</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                  पत्रकार: <span className="font-semibold text-ink">manisha@nagarikwatch.com</span> ·
                  सम्पादक: <span className="font-semibold text-ink">sushila@nagarikwatch.com</span> ·
                  पासवर्ड: <span className="font-semibold text-ink">demo1234</span>
                  <br />
                  (राजनीति र बजार डेस्कका डेमो खाता पनि उपलब्ध छन्।)
                </p>
              </div>
            </div>

            <form onSubmit={login} className="paper-card h-fit space-y-4 rounded-sm p-6">
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  कर्मचारी इमेल
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  पासवर्ड
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </label>
              {error && (
                <p className="rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-sm bg-crimson py-3 font-headline text-[16px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
              >
                {busy ? 'केही क्षण…' : 'समाचार कक्षमा प्रवेश'}
              </button>
              <p className="text-center text-[12px] text-ink-faint">
                खाता नभएका सम्पादक/पत्रकारले सम्पादकीय निर्देशकसँग सम्पर्क गर्नुहोस्।
              </p>
            </form>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------- newsroom desk ---------------- */
  const meJournalist = me.kind === 'journalist' ? me : null
  const deskStories = stories.filter((s) => s.desk === meJournalist?.desk).slice(0, 5)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pitch', label: 'पिच तथा डेस्क' },
    { id: 'editor', label: 'लेख लेख्नुहोस्' },
    { id: 'mine', label: 'मेरा लेखहरू' },
    ...(isEditor ? [{ id: 'editorDesk' as Tab, label: 'सम्पादक डेस्क' }] : []),
  ]

  return (
    <main id="main">
      <div className="crimson-band no-print">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <p className="font-headline text-[14px] font-bold text-white">
            समाचार कक्ष · {meJournalist?.name}
            {isEditor && <span className="ml-1.5 rounded-sm bg-white px-1.5 py-0.5 text-[11px] font-extrabold text-crimson-deep">सम्पादक</span>}
            <span className="ml-2 hidden font-normal text-white/70 sm:inline">({todayBs})</span>
          </p>
          <div className="flex items-center gap-3">
            <a
              href={href(`/${meJournalist?.desk}`)}
              className="font-headline text-[13px] font-semibold text-white/90 hover:text-white"
            >
              मेरो डेस्क →
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-sm border border-white/40 px-2.5 py-1 font-headline text-[12.5px] font-bold text-white transition-colors hover:bg-white hover:text-crimson-deep"
            >
              <LogOut className="size-3.5" /> निस्कनुहोस्
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 py-7">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-crimson font-headline text-[22px] font-extrabold text-white">
              {meJournalist ? initialOf(meJournalist.name) : '?'}
            </span>
            <div>
              <h1 className="font-headline text-[26px] font-extrabold text-ink">
                {meJournalist?.name}
              </h1>
              <p className="text-[13.5px] text-ink-soft">
                {meJournalist?.email} · डेस्क:{' '}
                <span className="font-semibold text-crimson">
                  {desks.find((d) => d.slug === meJournalist?.desk)?.nameNe ?? meJournalist?.desk}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-rule" role="tablist" aria-label="समाचार कक्ष विभाग">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px rounded-t-sm border-b-[3px] px-4 py-2.5 font-headline text-[14.5px] font-bold transition-colors ${
                tab === t.id
                  ? 'border-crimson text-crimson'
                  : 'border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-8 pb-16">
          {/* ---------------- pitch tab ---------------- */}
          {tab === 'pitch' && (
            <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1.25fr_1fr]">
              <section aria-label="नयाँ पिच">
                <h2 className="font-headline text-[20px] font-extrabold text-ink">
                  नयाँ पिच पठाउनुहोस्
                </h2>
                <form onSubmit={submitPitch} className="paper-card mt-3 space-y-4 rounded-sm p-5">
                  <label className="block">
                    <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                      शीर्षक
                    </span>
                    <input
                      required
                      minLength={5}
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className={inputClass}
                      placeholder="उदाहरण: स्थानीय तहमा शिक्षा बजेट खर्चको अवस्था"
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        डेस्क
                      </span>
                      <select
                        value={desk}
                        onChange={(e) => setDeskOverride(e.target.value)}
                        className={inputClass}
                      >
                        {desks.map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.nameNe}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        सारांश
                      </span>
                      <input
                        required
                        minLength={10}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={inputClass}
                        placeholder="के, कहाँ, किन — एक पङ्क्तिमा"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                      विस्तृत टिपोट (वैकल्पिक)
                    </span>
                    <textarea
                      rows={5}
                      value={pitchBody}
                      onChange={(e) => setPitchBody(e.target.value)}
                      className={`${inputClass} resize-y`}
                      placeholder="स्रोत, तथ्यांक, भेट गर्नुपर्ने मानिस…"
                    />
                  </label>
                  {submitMsg && (
                    <p className="rounded-sm bg-market-green/10 px-3 py-2.5 text-[13.5px] font-medium text-market-green">
                      {submitMsg}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-sm bg-crimson px-5 py-3 font-headline text-[15px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
                  >
                    <Send className="size-4" /> {submitting ? 'पठाँदै…' : 'सम्पादकीय डेस्कमा पठाउनुहोस्'}
                  </button>
                </form>

                <h2 className="mt-8 font-headline text-[20px] font-extrabold text-ink">
                  मेरा पिचहरू
                </h2>
                {pitches === null ? (
                  <p className="mt-3 text-[14px] text-ink-faint">लोड हुँदै…</p>
                ) : pitches.length === 0 ? (
                  <p className="paper-card mt-3 rounded-sm p-5 text-[14px] text-ink-faint">
                    अझै कुनै पिच पठाइएको छैन। माथिको फारमबाट पहिलो पिच पठाउनुहोस्।
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {pitches.map((p) => (
                      <li key={p.id} className="paper-card rounded-sm p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-headline text-[16.5px] font-bold text-ink">{p.headline}</p>
                          <span className="rounded-sm bg-ink/10 px-2 py-0.5 font-headline text-[11.5px] font-bold text-ink-soft">
                            {p.status === 'submitted'
                              ? 'पठाइएको'
                              : p.status === 'in_review'
                                ? 'समीक्षामा'
                                : p.status === 'accepted'
                                  ? 'स्वीकार'
                                  : 'अस्वीकार'}
                          </span>
                        </div>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{p.summary}</p>
                        {p.editorNote && (
                          <p className="mt-2 border-l-2 border-gold pl-3 text-[13px] text-ink-soft">
                            सम्पादक: {p.editorNote}
                          </p>
                        )}
                        <p className="mt-2 text-[11.5px] text-ink-faint">
                          {new Date(p.createdAt).toLocaleDateString('ne-NP')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <aside aria-label="मेरो डेस्क">
                <h2 className="font-headline text-[20px] font-extrabold text-ink">डेस्कका सामग्री</h2>
                <p className="mt-1 text-[13px] text-ink-soft">
                  {desks.find((d) => d.slug === meJournalist?.desk)?.nameNe} डेस्कमा हाल प्रकाशित सामग्री —{' '}
                  {toDevanagari(stories.filter((s) => s.desk === meJournalist?.desk).length)} वटा
                </p>
                <ul className="mt-3 divide-y divide-rule border-y border-rule">
                  {deskStories.map((s) => (
                    <li key={s.slug}>
                      <a href={href(`/${s.desk}/${s.slug}`)} className="group flex items-start gap-3 py-3.5">
                        <FileText className="mt-1 size-4 shrink-0 text-crimson" />
                        <span>
                          <span className="block font-headline text-[15.5px] font-bold leading-snug text-ink group-hover:text-crimson">
                            {s.titleNe}
                          </span>
                          <span className="mt-0.5 block text-[12px] text-ink-faint">
                            {toDevanagari(s.readingMinutes)} मिनेट पढाइ · {s.author}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="paper-card mt-4 rounded-sm p-4">
                  <p className="flex items-center gap-2 font-headline text-[14px] font-extrabold text-ink">
                    <PenLine className="size-4 text-crimson" /> सम्पादकीय सुझाव
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                    पिसँगै दुईभन्दा बढी स्रोत र मिति–तथ्यांक राख्नुहोस्। पूरा समाचार «लेख लेख्नुहोस्»
                    ट्याबबाट सिधै समीक्षामा पठाउन सकिन्छ। डेस्क सम्पादकले २४ घण्टाभित्र प्रतिक्रिया दिन्छन्।
                  </p>
                </div>
              </aside>
            </div>
          )}

          {/* ---------------- article editor tab ---------------- */}
          {tab === 'editor' && (
            <section aria-label="समाचार सम्पादक">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-headline text-[20px] font-extrabold text-ink">
                  {editingSlug ? 'समाचार सम्पादन' : 'नयाँ समाचार लेख्नुहोस्'}
                </h2>
                {editingSlug && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlug(null)
                      setDraft(EMPTY_DRAFT)
                      setEditorMsg('नयाँ खाली समाचार सुरु गरियो।')
                    }}
                    className="rounded-sm border border-rule px-3 py-1.5 font-headline text-[13px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
                  >
                    नयाँ समाचार सुरु
                  </button>
                )}
              </div>

              <div className="mt-3 grid gap-x-8 gap-y-6 lg:grid-cols-[1.35fr_1fr]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void saveDraft(false)
                  }}
                  className="paper-card space-y-4 rounded-sm p-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        डेस्क
                      </span>
                      <select
                        value={draft.desk}
                        onChange={(e) => setDraft((d) => ({ ...d, desk: e.target.value }))}
                        className={inputClass}
                      >
                        {desks.map((d) => (
                          <option key={d.slug} value={d.slug}>
                            {d.nameNe}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        Headline (English) — वैकल्पिक
                      </span>
                      <input
                        value={draft.titleEn}
                        onChange={(e) => setDraft((d) => ({ ...d, titleEn: e.target.value }))}
                        className={inputClass}
                        placeholder="Slug बनाउन पनि प्रयोग हुन्छ"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                      शीर्षक (नेपाली) *
                    </span>
                    <input
                      required
                      minLength={5}
                      value={draft.titleNe}
                      onChange={(e) => setDraft((d) => ({ ...d, titleNe: e.target.value }))}
                      className={inputClass}
                      placeholder="मुख्य शीर्षक — छोटो, स्पष्ट, तथ्यमा आधारित"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                      सारांश (नेपाली) *
                    </span>
                    <textarea
                      required
                      minLength={10}
                      rows={2}
                      value={draft.deckNe}
                      onChange={(e) => setDraft((d) => ({ ...d, deckNe: e.target.value }))}
                      className={`${inputClass} resize-y`}
                      placeholder="एक–दुई पङ्क्तिको सारांश (डेक)"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                      मुख्य सामग्री * <span className="font-normal text-ink-faint">(## उपशीर्षक · ### उप-शीर्षक · &gt; उद्धरण · - बुँदा)</span>
                    </span>
                    <textarea
                      required
                      rows={14}
                      value={draft.bodyNe}
                      onChange={(e) => setDraft((d) => ({ ...d, bodyNe: e.target.value }))}
                      className={`${inputClass} resize-y font-normal leading-[1.9]`}
                      placeholder={'पहिलो अनुच्छेद…\n\n## उपशीर्षक\n\n> महत्त्वपूर्ण उद्धरण\n\n- पहिलो बुँदा\n- दोस्रो बुँदा'}
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        तस्वीर (डेस्क चित्र वा URL)
                      </span>
                      <select
                        value={draft.hero.startsWith('/photos/desks/') ? draft.hero : ''}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, hero: e.target.value || d.hero }))
                        }
                        className={inputClass}
                      >
                        <option value="">— स्वत: डेस्क चित्र —</option>
                        {desks.map((d) => (
                          <option key={d.slug} value={`/photos/desks/${d.slug}.jpg`}>
                            {d.nameNe} (सम्पादकीय चित्र)
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                        विषय ट्यागहरू (कमाले छुट्टिएको)
                      </span>
                      <input
                        value={draft.tags}
                        onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
                        className={inputClass}
                        placeholder="चुनाव, बजेट, स्थानीय तह"
                      />
                    </label>
                  </div>

                  <details className="rounded-sm border border-rule px-4 py-3">
                    <summary className="cursor-pointer font-headline text-[14px] font-bold text-ink-soft">
                      अङ्ग्रेजी संस्करण (वैकल्पिक)
                    </summary>
                    <div className="mt-3 space-y-3">
                      <label className="block">
                        <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                          Deck (English)
                        </span>
                        <input
                          value={draft.deckEn}
                          onChange={(e) => setDraft((d) => ({ ...d, deckEn: e.target.value }))}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                          Body (English)
                        </span>
                        <textarea
                          rows={8}
                          value={draft.bodyEn}
                          onChange={(e) => setDraft((d) => ({ ...d, bodyEn: e.target.value }))}
                          className={`${inputClass} resize-y`}
                          placeholder="Same markdown-lite syntax"
                        />
                      </label>
                    </div>
                  </details>

                  {editorMsg && (
                    <p className="rounded-sm bg-market-green/10 px-3 py-2.5 text-[13.5px] font-medium text-market-green">
                      {editorMsg}
                    </p>
                  )}
                  {editorError && (
                    <p className="rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">
                      {editorError}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-sm border border-crimson px-5 py-3 font-headline text-[15px] font-bold text-crimson transition-colors hover:bg-crimson-wash disabled:opacity-60"
                    >
                      <Save className="size-4" /> {saving ? '…' : 'ड्राफ्ट सुरक्षित गर्नुहोस्'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveDraft(true)}
                      className="flex items-center gap-2 rounded-sm bg-crimson px-5 py-3 font-headline text-[15px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
                    >
                      <Send className="size-4" /> {saving ? '…' : 'समीक्षामा पठाउनुहोस्'}
                    </button>
                  </div>
                </form>

                {/* live preview */}
                <aside aria-label="पूर्वावलोकन">
                  <div className="paper-card sticky top-20 rounded-sm p-5">
                    <p className="flex items-center gap-2 font-headline text-[14px] font-extrabold text-ink-soft">
                      <Eye className="size-4 text-crimson" /> पूर्वावलोकन
                    </p>
                    {draft.titleNe ? (
                      <div className="mt-3">
                        <p className="font-headline text-[12px] font-bold uppercase text-crimson">
                          {desks.find((d) => d.slug === draft.desk)?.nameNe}
                        </p>
                        <h3 className="mt-1 font-headline text-[22px] font-extrabold leading-tight text-ink">
                          {draft.titleNe}
                        </h3>
                        {draft.deckNe && (
                          <p className="mt-2 border-l-2 border-crimson/50 pl-3 text-[14px] leading-relaxed text-ink-soft">
                            {draft.deckNe}
                          </p>
                        )}
                        <div className="mt-3 max-h-[380px] space-y-3 overflow-y-auto border-t border-rule pt-3 text-[14.5px] leading-[1.85] text-ink">
                          {parsedPreview.map((b, i) => {
                            if (b.k === 'h2')
                              return (
                                <h4 key={i} className="font-headline text-[17px] font-extrabold text-ink">
                                  {b.text}
                                </h4>
                              )
                            if (b.k === 'h3')
                              return (
                                <h5 key={i} className="font-headline text-[15.5px] font-bold text-ink">
                                  {b.text}
                                </h5>
                              )
                            if (b.k === 'quote')
                              return (
                                <blockquote key={i} className="border-l-[3px] border-crimson/60 pl-3 italic text-ink-soft">
                                  “{b.text}”
                                </blockquote>
                              )
                            if (b.k === 'list')
                              return (
                                <ul key={i} className="list-disc space-y-1 pl-5 marker:text-crimson">
                                  {b.items.map((it, j) => (
                                    <li key={j}>{it}</li>
                                  ))}
                                </ul>
                              )
                            return <p key={i}>{b.text}</p>
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-[13.5px] text-ink-faint">
                        शीर्षक लेख्दै गर्दा यहाँ पूर्वावलोकन देखिन्छ।
                      </p>
                    )}
                    <p className="mt-3 border-t border-rule pt-2.5 text-[12px] text-ink-faint">
                      {toDevanagari(previewWords)} शब्द · अनुमानित{' '}
                      {toDevanagari(readingMinutesOf(parsedPreview))} मिनेट पढाइ
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {/* ---------------- my articles tab ---------------- */}
          {tab === 'mine' && (
            <section aria-label="मेरा लेखहरू">
              <h2 className="font-headline text-[20px] font-extrabold text-ink">मेरा लेखहरू</h2>
              <p className="mt-1 text-[13.5px] text-ink-soft">
                ड्राफ्ट → समीक्षा → प्रकाशन — सम्पादकले स्वीकृत गरेपछि समाचार साइटमा सिधै देखिन्छ।
              </p>
              {editorError && (
                <p className="mt-3 rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">
                  {editorError}
                </p>
              )}
              {myArticles === null ? (
                <p className="mt-4 flex items-center gap-2 text-[14px] text-ink-faint">
                  <Loader2 className="size-4 animate-spin" /> लोड हुँदै…
                </p>
              ) : myArticles.length === 0 ? (
                <p className="paper-card mt-4 rounded-sm p-5 text-[14px] text-ink-faint">
                  अझै कुनै समाचार लेखिएको छैन — «लेख लेख्नुहोस्» ट्याबबाट सुरु गर्नुहोस्।
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {myArticles.map((a) => (
                    <li key={a.slug} className="paper-card rounded-sm p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-headline text-[16.5px] font-bold leading-snug text-ink">
                            {a.titleNe}
                          </p>
                          <p className="mt-1 text-[12.5px] text-ink-faint">
                            {desks.find((d) => d.slug === a.desk)?.nameNe} ·{' '}
                            {a.status === 'published' && a.publishedAt
                              ? `प्रकाशित: ${new Date(a.publishedAt).toLocaleDateString('ne-NP')} · ${toDevanagari(a.views)} पटक पढिएको`
                              : `अद्यावधिक: ${new Date(a.updatedAt).toLocaleDateString('ne-NP')}`}
                          </p>
                          {a.editorNote && (
                            <p className="mt-1.5 border-l-2 border-gold pl-3 text-[12.5px] text-ink-soft">
                              सम्पादक: {a.editorNote}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-sm px-2 py-0.5 font-headline text-[11.5px] font-bold ${
                            STATUS_CLASS[a.status] ?? 'bg-ink/10 text-ink-soft'
                          }`}
                        >
                          {STATUS_NE[a.status] ?? a.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {a.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => void loadForEdit(a.slug)}
                            className="rounded-sm border border-rule px-3 py-1.5 font-headline text-[12.5px] font-bold text-ink-soft transition-colors hover:border-crimson hover:text-crimson"
                          >
                            सम्पादन
                          </button>
                        )}
                        {a.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => void articleAction(a.slug, 'submit')}
                            className="rounded-sm bg-crimson px-3 py-1.5 font-headline text-[12.5px] font-bold text-white hover:bg-crimson-deep"
                          >
                            समीक्षामा पठाउनुहोस्
                          </button>
                        )}
                        {a.status === 'submitted' && (
                          <button
                            type="button"
                            onClick={() => void articleAction(a.slug, 'retract')}
                            className="flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-headline text-[12.5px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
                          >
                            <Undo2 className="size-3.5" /> फिर्ता
                          </button>
                        )}
                        {a.status === 'published' && (
                          <a
                            href={href(`/${a.desk}/${a.slug}`)}
                            className="rounded-sm border border-market-green/40 px-3 py-1.5 font-headline text-[12.5px] font-bold text-market-green hover:bg-market-green/10"
                          >
                            साइटमा हेर्नुहोस्
                          </a>
                        )}
                        {a.status !== 'published' && (
                          <button
                            type="button"
                            onClick={() => void articleAction(a.slug, 'delete')}
                            className="flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-headline text-[12.5px] font-bold text-ink-faint transition-colors hover:border-crimson hover:text-crimson"
                          >
                            <Trash2 className="size-3.5" /> मेट्नुहोस्
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* ---------------- editor dashboard tab ---------------- */}
          {tab === 'editorDesk' && isEditor && <EditorDashboard onPublished={() => {
            void loadMine()
            void refreshArticles(true)
          }} />}
        </div>
      </div>
    </main>
  )
}
