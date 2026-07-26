'use client'

import { useState } from 'react'

/**
 * PollsManager — the /admin/polls create/edit/list surface.
 *
 * State is held client-side (useState) until the CMS poll store is wired. The
 * shape matches the public PollOfDay contract (id, question, options[]) so
 * when the persistence layer lands the only change is swapping setState for a
 * fetch + the homepage PollOfDay reading the persisted poll instead of the
 * seed. No data is faked as persisted; the empty state says so explicitly.
 */
type Option = { id: string; labelNe: string; labelEn: string; seedVotes: number }

type PollDraft = {
  id: string
  questionNe: string
  questionEn: string
  status: 'draft' | 'open' | 'closed'
  options: Option[]
}

const EMPTY: PollDraft = {
  id: '',
  questionNe: '',
  questionEn: '',
  status: 'draft',
  options: [
    { id: 'a', labelNe: '', labelEn: '', seedVotes: 0 },
    { id: 'b', labelNe: '', labelEn: '', seedVotes: 0 },
  ],
}

export function PollsManager() {
  const [draft, setDraft] = useState<PollDraft>(EMPTY)
  const [saved, setSaved] = useState<PollDraft[]>([])

  function update<K extends keyof PollDraft>(key: K, value: PollDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function updateOption(idx: number, patch: Partial<Option>) {
    setDraft((d) => ({
      ...d,
      options: d.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)),
    }))
  }

  function addOption() {
    setDraft((d) => ({
      ...d,
      options: [
        ...d.options,
        { id: String.fromCharCode(97 + d.options.length), labelNe: '', labelEn: '', seedVotes: 0 },
      ],
    }))
  }

  function removeOption(idx: number) {
    setDraft((d) => ({
      ...d,
      options: d.options.filter((_, i) => i !== idx),
    }))
  }

  function save() {
    const id = draft.id || toPollId(draft.questionNe || draft.questionEn)
    const finalized: PollDraft = { ...draft, id }
    setSaved((list) => [...list.filter((p) => p.id !== id), finalized])
    setDraft({ ...EMPTY })
  }

  function edit(p: PollDraft) {
    setDraft(p)
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h2 text-ink">{draft.id ? 'Edit poll' : 'Create poll'}</h2>
        <p className="mt-1 text-caption text-mute">
          In-memory only until the poll store + vote endpoint are wired. Saved drafts do not persist
          across reloads.
        </p>

        <div className="mt-4 grid gap-4">
          <Field label="Question (Nepali)">
            <input
              type="text"
              value={draft.questionNe}
              onChange={(e) => update('questionNe', e.target.value)}
              className="nw-input"
              placeholder="नेपाली प्रश्न"
              lang="ne"
            />
          </Field>
          <Field label="Question (English)">
            <input
              type="text"
              value={draft.questionEn}
              onChange={(e) => update('questionEn', e.target.value)}
              className="nw-input"
              placeholder="English question"
              lang="en"
            />
          </Field>
          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) => update('status', e.target.value as PollDraft['status'])}
              className="nw-input"
            >
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </Field>

          <div>
            <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft">Options</p>
            <ul className="mt-2 grid gap-2">
              {draft.options.map((opt, i) => (
                <li
                  key={opt.id}
                  className="grid gap-2 rounded-md border border-rule p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    type="text"
                    value={opt.labelNe}
                    onChange={(e) => updateOption(i, { labelNe: e.target.value })}
                    className="nw-input"
                    placeholder="नेपाली"
                    lang="ne"
                  />
                  <input
                    type="text"
                    value={opt.labelEn}
                    onChange={(e) => updateOption(i, { labelEn: e.target.value })}
                    className="nw-input"
                    placeholder="English"
                    lang="en"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="rounded-md border border-rule px-3 py-2 text-meta text-ink-soft hover:border-brand hover:text-brand-strong"
                    aria-label="Remove option"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 rounded-md border border-rule px-3 py-1.5 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            >
              + Add option
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!draft.questionNe && !draft.questionEn}
              className="rounded-md bg-brand px-4 py-2 text-body font-semibold text-paper-raised disabled:opacity-40 hover:bg-brand-strong"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => setDraft({ ...EMPTY })}
              className="rounded-md border border-rule px-4 py-2 text-body text-ink-soft hover:border-brand hover:text-brand-strong"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h2 text-ink">Saved polls ({saved.length})</h2>
        {saved.length === 0 ? (
          <p className="mt-3 text-body text-mute">
            No drafts yet. Saved drafts appear here for this session.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {saved.map((p) => (
              <li key={p.id} className="rounded-md border border-rule p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink" lang="ne">
                      {p.questionNe || <span lang="en">{p.questionEn}</span>}
                    </p>
                    <p className="mt-1 text-caption text-ink-soft">
                      {p.status} · {p.options.length} options · <code>{p.id}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => edit(p)}
                    className="shrink-0 rounded-md border border-rule px-3 py-1.5 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <style>{`
        .nw-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid var(--rule);
          background: var(--surface);
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          color: var(--ink);
        }
        .nw-input:focus {
          outline: none;
          border-color: var(--brand);
          box-shadow: 0 0 0 2px var(--brand-tint);
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-meta font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function toPollId(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `poll-${Date.now()}`
  )
}
