'use client'

import { useState, useTransition } from 'react'

export function JournalistFeedbackActions({ identifier, reporterId, initialFeedback }: { identifier: string; reporterId: string; initialFeedback?: string }) {
  const [feedback, setFeedback] = useState(initialFeedback ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function send(action: 'revision' | 'note' | 'clear') {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch('/api/admin/journalist-feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier, reporterId, feedback, action }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        setMessage(String(body.error ?? 'प्रतिक्रिया सुरक्षित गर्न सकिएन।'))
        return
      }
      if (action === 'clear') setFeedback('')
      setMessage(action === 'revision' ? 'संशोधन अनुरोध पठाइयो।' : action === 'clear' ? 'प्रतिक्रिया हटाइयो।' : 'सम्पादकीय नोट सुरक्षित भयो।')
    })
  }

  return (
    <div className="admin-feedback-control">
      <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} maxLength={4000} placeholder="ठोस संशोधन बुँदा, तथ्य-जाँच प्रश्न वा स्वीकृति नोट…" />
      <div>
        <button type="button" onClick={() => send('revision')} disabled={pending || feedback.trim().length < 3}>संशोधन माग</button>
        <button type="button" onClick={() => send('note')} disabled={pending || feedback.trim().length < 3}>नोट सुरक्षित</button>
        {initialFeedback ? <button type="button" onClick={() => send('clear')} disabled={pending}>हटाउनुहोस्</button> : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </div>
  )
}
