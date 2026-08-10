import 'server-only'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html?: string
  from?: string
}

export type EmailProviderState = {
  ready: boolean
  provider: 'resend' | 'generic' | 'none'
  detail: string
}

export function getEmailProviderState(): EmailProviderState {
  if (process.env.RESEND_API_KEY?.trim()) {
    return { ready: true, provider: 'resend', detail: 'Resend API configured' }
  }
  if (process.env.NEWSLETTER_API_KEY?.trim() && process.env.NEWSLETTER_API_BASE?.trim()) {
    return { ready: true, provider: 'generic', detail: 'Generic newsletter API configured' }
  }
  return {
    ready: false,
    provider: 'none',
    detail: 'Set RESEND_API_KEY or NEWSLETTER_API_KEY + NEWSLETTER_API_BASE',
  }
}

function sender(): string {
  return process.env.NEWSLETTER_FROM?.trim() || 'Nagarik Watch <newsletter@nagarikwatch.com>'
}

async function responseError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '')
  return text.trim().slice(0, 500) || `${response.status} ${response.statusText}`
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const state = getEmailProviderState()
  const from = message.from?.trim() || sender()

  if (state.provider === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error(`Resend rejected email: ${await responseError(response)}`)
    return
  }

  if (state.provider === 'generic') {
    const base = process.env.NEWSLETTER_API_BASE!.trim().replace(/\/$/, '')
    const response = await fetch(`${base}/messages`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.NEWSLETTER_API_KEY!.trim()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok)
      throw new Error(`Email provider rejected message: ${await responseError(response)}`)
    return
  }

  throw new Error(state.detail)
}
