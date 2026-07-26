'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { TurnstileField } from './TurnstileField'

type Props = { locale: Locale }

export function ReaderSubmissionForm({ locale }: Props) {
  const ne = locale === 'ne'
  const [anonymous, setAnonymous] = useState(false)
  const [state, setState] = useState<{ type: 'ok' | 'error'; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState(null)
    const form = event.currentTarget
    const data = new FormData(form)
    const payload = {
      type: String(data.get('type') ?? 'tip'),
      headline: String(data.get('headline') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      phone: String(data.get('phone') ?? '').trim(),
      evidenceUrl: String(data.get('evidenceUrl') ?? '').trim(),
      anonymous,
      consent: data.get('consent') === 'on',
      turnstileToken: String(data.get('cf-turnstile-response') ?? ''),
      locale,
    }

    if (!payload.headline || !payload.description || !payload.consent) {
      setState({
        type: 'error',
        message: ne
          ? 'शीर्षक, विवरण र सहमति अनिवार्य छन्।'
          : 'Headline, description and consent are required.',
      })
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          setState({
            type: 'error',
            message: String(body?.error ?? (ne ? 'पेश गर्न सकिएन।' : 'Could not submit.')),
          })
          return
        }
        form.reset()
        setAnonymous(false)
        setState({
          type: 'ok',
          message: ne
            ? `टिप प्राप्त भयो। Ref: ${body.id}`
            : `Submission received. Ref: ${body.id}`,
        })
      } catch {
        setState({ type: 'error', message: ne ? 'नेटवर्क त्रुटि।' : 'Network error.' })
      }
    })
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-4 rounded-xl border border-rule bg-surface p-5" noValidate>
      {state ? (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-meta font-semibold ${
            state.type === 'ok'
              ? 'border-brand/30 bg-brand-tint text-brand-strong'
              : 'border-breaking/30 bg-surface text-breaking'
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-meta font-semibold text-ink">
          {ne ? 'सबमिसन प्रकार' : 'Submission type'}
          <select name="type" className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink">
            <option value="tip">{ne ? 'समाचार टिप' : 'News tip'}</option>
            <option value="document">{ne ? 'कागजात' : 'Document'}</option>
            <option value="photo">{ne ? 'फोटो' : 'Photo'}</option>
            <option value="video">{ne ? 'भिडियो' : 'Video'}</option>
            <option value="psa">{ne ? 'सार्वजनिक सूचना / PSA' : 'Public service notice / PSA'}</option>
            <option value="correction">{ne ? 'सच्च्याउने अनुरोध' : 'Correction request'}</option>
            <option value="other">{ne ? 'अन्य' : 'Other'}</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-meta font-semibold text-ink">
          {ne ? 'शीर्षक' : 'Headline'}
          <input name="headline" required maxLength={160} className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink" />
        </label>
      </div>

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'तपाईंले के देख्नुभयो?' : 'What should the newsroom know?'}
        <textarea name="description" required maxLength={5000} className="min-h-44 rounded-md border border-rule bg-surface px-3 py-3 text-body text-ink" />
      </label>

      <label className="grid gap-1.5 text-meta font-semibold text-ink">
        {ne ? 'प्रमाण लिंक / फाइल लोकेसन' : 'Evidence link / file location'}
        <input name="evidenceUrl" type="url" placeholder="https://…" className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink" />
        <span className="text-caption font-normal text-mute">
          {ne ? 'संवेदनशील प्रमाण भए सम्पादकले सुरक्षित माध्यमबाट सम्पर्क गर्नेछन्।' : 'For sensitive evidence, editors will follow up through a safer channel.'}
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-lg border border-rule bg-surface-raised p-3 text-meta font-semibold text-ink">
        <input type="checkbox" className="mt-1" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />
        <span>{ne ? 'म नाम सार्वजनिक गर्न चाहन्न।' : 'I want to stay anonymous publicly.'}</span>
      </label>

      {!anonymous ? (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'नाम' : 'Name'}
            <input name="name" className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink" />
          </label>
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'इमेल' : 'Email'}
            <input name="email" type="email" className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink" />
          </label>
          <label className="grid gap-1.5 text-meta font-semibold text-ink">
            {ne ? 'फोन' : 'Phone'}
            <input name="phone" className="rounded-md border border-rule bg-surface px-3 py-2.5 text-body text-ink" />
          </label>
        </div>
      ) : null}

      <label className="flex items-start gap-3 rounded-lg border border-rule bg-surface-raised p-3 text-meta font-semibold text-ink">
        <input name="consent" type="checkbox" className="mt-1" required />
        <span>
          {ne
            ? 'नागरिक वाचले यो जानकारी सम्पादकीय प्रमाणीकरणका लागि प्रयोग गर्न सक्छ भन्ने कुरामा सहमत छु।'
            : 'I agree that Nagarik Watch may use this information for editorial verification.'}
        </span>
      </label>

      <TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />

      <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong disabled:opacity-60">
        {pending ? (ne ? 'पठाउँदै…' : 'Submitting…') : ne ? 'न्यूजरुममा पठाउनुहोस्' : 'Send to newsroom'}
      </button>
    </form>
  )
}
