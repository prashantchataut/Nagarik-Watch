import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { localizeHref } from '@/lib/i18n/locales'

type AuthMode = 'login' | 'signup' | 'recover' | 'reset' | 'change' | 'invite'

const copy: Record<
  AuthMode,
  {
    formTitleNe: string
    formTitleEn: string
    formBodyNe: string
    formBodyEn: string
    panelTitleNe: string
    panelTitleEn: string
    panelBodyNe: string
    panelBodyEn: string
  }
> = {
  login: {
    formTitleNe: 'पाठक खाता',
    formTitleEn: 'Reader account',
    formBodyNe: 'सुरक्षित समाचार र पढाइ इतिहास सिंक गर्न लगइन गर्नुहोस्।',
    formBodyEn: 'Sign in to sync saved stories and reading history.',
    panelTitleNe: 'समाचार खुला नै रहन्छ',
    panelTitleEn: 'News stays open',
    panelBodyNe:
      'खाता समाचार पढ्नका लागि होइन। यो सुरक्षित सामग्री, इतिहास र व्यक्तिगत प्राथमिकताका लागि मात्र हो।',
    panelBodyEn:
      'An account is not required to read. It is only for saved stories, history and reader preferences.',
  },
  signup: {
    formTitleNe: 'पाठक खाता बनाउनुहोस्',
    formTitleEn: 'Create a reader account',
    formBodyNe: 'इमेल र पासवर्डले उपकरणबीच सुरक्षित सामग्री सिंक गर्नुहोस्।',
    formBodyEn: 'Use email and password to sync saved stories across devices.',
    panelTitleNe: 'पाठक पहिलो',
    panelTitleEn: 'Reader first',
    panelBodyNe:
      'सार्वजनिक साइनअपले न्युजरुम भूमिका दिँदैन। पत्रकार र सम्पादकीय पहुँच निमन्त्रणाबाट मात्र आउँछ।',
    panelBodyEn:
      'Public sign-up never grants newsroom roles. Reporter and editorial access are invitation-only.',
  },
  recover: {
    formTitleNe: 'पासवर्ड रिसेट',
    formTitleEn: 'Reset password',
    formBodyNe: 'खातामा प्रयोग भएको इमेल लेख्नुहोस्।',
    formBodyEn: 'Enter the email used for your account.',
    panelTitleNe: 'एक पटकको सुरक्षित लिंक',
    panelTitleEn: 'Single-use recovery link',
    panelBodyNe:
      'खाता भएमा रिसेट लिंक इमेलमा पठाइन्छ। सुरक्षा कारणले हामी यहाँ खाता छ वा छैन भन्ने पुष्टि गर्दैनौँ।',
    panelBodyEn:
      'If an account exists, a recovery link is emailed. For security, this screen does not confirm whether an address is registered.',
  },
  reset: {
    formTitleNe: 'नयाँ पासवर्ड',
    formTitleEn: 'Choose a new password',
    formBodyNe: 'कम्तीमा ८ अक्षरको बलियो पासवर्ड राख्नुहोस्।',
    formBodyEn: 'Choose a strong password with at least 8 characters.',
    panelTitleNe: 'लिंकको अवस्था',
    panelTitleEn: 'Recovery link',
    panelBodyNe:
      'मान्य रिकभरी टोकन URL बाट पढिन्छ। म्याद सकिएको वा अपूर्ण लिंकले पासवर्ड परिवर्तन गर्दैन।',
    panelBodyEn:
      'The recovery token is read from the URL. Expired or incomplete links cannot change a password.',
  },
  change: {
    formTitleNe: 'पासवर्ड परिवर्तन',
    formTitleEn: 'Change password',
    formBodyNe: 'हालको पासवर्ड पुष्टि गरेर नयाँ पासवर्ड राख्नुहोस्।',
    formBodyEn: 'Confirm your current password before setting a new one.',
    panelTitleNe: 'खाता सुरक्षा',
    panelTitleEn: 'Account security',
    panelBodyNe: 'पासवर्ड परिवर्तनपछि अन्य उपकरणका सत्र बन्द गर्न सकिन्छ।',
    panelBodyEn: 'After changing your password, other device sessions can be invalidated.',
  },
  invite: {
    formTitleNe: 'न्युजरुम निमन्त्रणा',
    formTitleEn: 'Newsroom invitation',
    formBodyNe: 'निमन्त्रणा आएको यही इमेलको खाताबाट स्वीकार गर्नुहोस्।',
    formBodyEn: 'Accept with the account using the same email that received the invite.',
    panelTitleNe: 'भूमिका सम्पादकले दिन्छन्',
    panelTitleEn: 'Editorial roles are granted',
    panelBodyNe:
      'पाठक खातालाई न्युजरुम भूमिकामा उचाल्ने काम वैध, म्यादभित्रको निमन्त्रणा र सर्भर-side अनुमति जाँचपछि मात्र हुन्छ।',
    panelBodyEn:
      'A reader account is elevated only after a valid, unexpired invite and server-side permission checks.',
  },
}

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
  const showRoleSwitch = mode === 'login' || mode === 'signup'
  const lang = ne ? 'ne' : 'en'

  return (
    <main className="min-h-[78vh] bg-surface py-8 sm:py-12" lang={lang}>
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-5">
        <header className="flex items-center justify-between gap-4 border-b border-rule pb-4">
          <Link
            href={localizeHref(locale, '/')}
            aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}
          >
            <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          </Link>
          <span className="text-caption font-bold text-mute">
            {ne ? 'पाठक सेवा' : 'Reader service'}
          </span>
        </header>

        {showRoleSwitch ? (
          <nav className="border-b border-rule" aria-label={ne ? 'खाता प्रकार' : 'Account type'}>
            <div className="flex min-w-0 overflow-x-auto">
              <Link
                href={localizeHref(locale, '/auth/login')}
                className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-brand px-3 text-meta font-extrabold text-brand-strong"
              >
                {ne ? 'पाठक' : 'Reader'}
              </Link>
              <Link
                href={localizeHref(locale, '/journalist/login')}
                className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-meta font-bold text-ink-soft hover:border-rule-strong hover:text-ink"
              >
                {ne ? 'पत्रकार डेस्क' : 'Reporter desk'}
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-meta font-bold text-ink-soft hover:border-rule-strong hover:text-ink"
              >
                {ne ? 'सम्पादकीय एडमिन' : 'Editorial admin'}
              </Link>
            </div>
          </nav>
        ) : null}

        <div className="grid border-b border-rule lg:grid-cols-[minmax(0,0.86fr)_minmax(24rem,1.14fr)]">
          <aside className="border-b border-rule py-8 lg:border-b-0 lg:border-r lg:py-12 lg:pr-10">
            <p className="text-caption font-extrabold text-brand-strong">
              {ne ? 'नागरिक वाच खाता' : 'Nagarik Watch account'}
            </p>
            <h2 className="mt-2 max-w-lg font-display text-[clamp(1.9rem,4vw,3.1rem)] font-black leading-[1.12] text-ink">
              {ne ? content.panelTitleNe : content.panelTitleEn}
            </h2>
            <span className="mt-4 block h-0.5 w-12 bg-brand" aria-hidden="true" />
            <p className="mt-4 max-w-lg text-body leading-relaxed text-ink-soft">
              {ne ? content.panelBodyNe : content.panelBodyEn}
            </p>
          </aside>

          <section className="py-8 lg:py-12 lg:pl-10" aria-labelledby="reader-auth-title">
            <p className="text-caption font-bold text-mute">
              {ne ? 'सुरक्षित पहुँच' : 'Secure access'}
            </p>
            <h1 id="reader-auth-title" className="mt-1 font-display text-h1 font-black text-ink">
              {ne ? content.formTitleNe : content.formTitleEn}
            </h1>
            <p className="mt-2 max-w-body text-meta leading-relaxed text-ink-soft">
              {ne ? content.formBodyNe : content.formBodyEn}
            </p>
            <div className="mt-6 max-w-lg">{children}</div>
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-4 text-caption text-mute">
          <p>{ne ? 'समाचार पढ्न खाता चाहिँदैन।' : 'No account is required to read the news.'}</p>
          <Link
            href={localizeHref(locale, '/privacy')}
            className="font-bold text-ink-soft hover:text-brand-strong"
          >
            {ne ? 'गोपनीयता' : 'Privacy'}
          </Link>
        </footer>
      </div>
    </main>
  )
}
