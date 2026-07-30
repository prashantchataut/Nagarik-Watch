import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { localizeHref } from '@/lib/i18n/locales'

type AuthMode = 'login' | 'signup' | 'recover' | 'reset' | 'change' | 'invite'

type AuthCopy = {
  formTitleNe: string
  formTitleEn: string
  formBodyNe: string
  formBodyEn: string
  panelTitleNe: string
  panelTitleEn: string
  panelBodyNe: string
  panelBodyEn: string
}

const copy: Record<AuthMode, AuthCopy> = {
  login: {
    formTitleNe: 'पाठक लगइन',
    formTitleEn: 'Reader sign-in',
    formBodyNe: 'संग्रह र पढाइ इतिहासका लागि इमेल प्रयोग गर्नुहोस्।',
    formBodyEn: 'Use your email for saved stories and reading history.',
    panelTitleNe: 'पढाइ सधैं खुला',
    panelTitleEn: 'Reading stays free',
    panelBodyNe: 'खाता वैकल्पिक हो। समाचार पढ्न साइन इन चाहिँदैन।',
    panelBodyEn: 'Accounts are optional. You never need to sign in just to read.',
  },
  signup: {
    formTitleNe: 'खाता बनाउनुहोस्',
    formTitleEn: 'Create account',
    formBodyNe: 'निःशुल्क। संग्रह र सिफारिसका लागि मात्र।',
    formBodyEn: 'Free. Only for saving and recommendations.',
    panelTitleNe: 'नयाँ खाता',
    panelTitleEn: 'New account',
    panelBodyNe: 'पढाइ सधैं खुला रहन्छ। सदस्यता पेवाल होइन।',
    panelBodyEn: 'Reading stays free. This is not a paywall.',
  },
  recover: {
    formTitleNe: 'पासवर्ड रिसेट',
    formTitleEn: 'Reset password',
    formBodyNe: 'दर्ता भएको इमेल लेख्नुहोस्।',
    formBodyEn: 'Enter the email on your account.',
    panelTitleNe: 'पुनःप्राप्ति',
    panelTitleEn: 'Recovery',
    panelBodyNe: 'हामी खाता छ कि छैन भनेर बताउँदैनौँ।',
    panelBodyEn: 'We never reveal whether an account exists.',
  },
  reset: {
    formTitleNe: 'नयाँ पासवर्ड',
    formTitleEn: 'New password',
    formBodyNe: 'कम्तीमा ८ अक्षरको फरक पासवर्ड।',
    formBodyEn: 'Use a distinct password with at least 8 characters.',
    panelTitleNe: 'सुरक्षित लिंक',
    panelTitleEn: 'Secure link',
    panelBodyNe: 'लिंक एकपटक मात्र प्रयोग हुन्छ।',
    panelBodyEn: 'This link works once.',
  },
  change: {
    formTitleNe: 'पासवर्ड परिवर्तन',
    formTitleEn: 'Change password',
    formBodyNe: 'हालको पासवर्ड पुष्टि गर्नुहोस्।',
    formBodyEn: 'Confirm your current password first.',
    panelTitleNe: 'सुरक्षा',
    panelTitleEn: 'Security',
    panelBodyNe: 'अन्य उपकरणका सत्र बन्द हुन्छन्।',
    panelBodyEn: 'Other device sessions will close.',
  },
  invite: {
    formTitleNe: 'निमन्त्रणा स्वीकार',
    formTitleEn: 'Accept invite',
    formBodyNe: 'निमन्त्रणा आएको इमेलसँग मिलाउनुहोस्।',
    formBodyEn: 'Match the email that received the invite.',
    panelTitleNe: 'न्युजरुम',
    panelTitleEn: 'Newsroom',
    panelBodyNe: 'भूमिका सम्पादकद्वारा दिइन्छ।',
    panelBodyEn: 'Roles are granted by editors.',
  },
}

/** Calm reader auth layout: light form first; editorial panel only on large screens. */
export function ReaderAuthShell({
  locale,
  mode,
  children,
}: {
  locale: 'ne' | 'en'
  mode: AuthMode
  children: ReactNode
}) {
  const ne = locale === 'ne'
  const content = copy[mode]

  return (
    <div className="auth-shell">
      <aside className="auth-editorial" aria-hidden="true">
        <p className="auth-editorial__eyebrow" lang={ne ? 'ne' : 'en'}>
          {ne ? content.panelTitleNe : content.panelTitleEn}
        </p>
        <p className="auth-editorial__lede" lang={ne ? 'ne' : 'en'}>
          {ne ? content.panelBodyNe : content.panelBodyEn}
        </p>
      </aside>
      <section className="auth-form-column">
        <div className="auth-form-wrap">
          <Link
            href={localizeHref(locale, '/')}
            className="auth-form-wrap__brand"
            aria-label={ne ? 'गृहपृष्ठ' : 'Home'}
          >
            <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          </Link>
          <h1 className="auth-form-wrap__title" lang={ne ? 'ne' : 'en'}>
            {ne ? content.formTitleNe : content.formTitleEn}
          </h1>
          <p className="auth-form-wrap__lede" lang={ne ? 'ne' : 'en'}>
            {ne ? content.formBodyNe : content.formBodyEn}
          </p>
          <div className="auth-form-surface">{children}</div>
          <p className="auth-form-wrap__foot" lang={ne ? 'ne' : 'en'}>
            {ne ? (
              <>
                समाचार पढ्न खाता चाहिँदैन। <Link href={localizeHref(locale, '/')}>गृहपृष्ठ</Link>
              </>
            ) : (
              <>
                No account needed to read. <Link href={localizeHref(locale, '/')}>Home</Link>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
