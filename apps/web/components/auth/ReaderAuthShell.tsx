import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AuthIllustration } from '@/components/auth/AuthIllustration'
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
    formTitleNe: 'फेरि स्वागत छ',
    formTitleEn: 'Welcome back',
    formBodyNe: 'सुरक्षित समाचार, पढाइ इतिहास र विषय प्राथमिकता हेर्न लगइन गर्नुहोस्।',
    formBodyEn: 'Sign in to view saved stories, reading history and topic preferences.',
    panelTitleNe: 'समाचार पढ्न लगइन चाहिँदैन',
    panelTitleEn: 'Reading stays open',
    panelBodyNe: 'खाताले उपकरणबीच सुरक्षित समाचार र तपाईंका पढाइ प्राथमिकता सिंक गर्छ।',
    panelBodyEn: 'An account syncs saved stories and reading preferences across your devices.',
  },
  signup: {
    formTitleNe: 'पाठक खाता बनाउनुहोस्',
    formTitleEn: 'Create a reader account',
    formBodyNe: 'इमेल र पासवर्डबाट तपाईंको पढाइ सूची उपकरणबीच राख्नुहोस्।',
    formBodyEn: 'Use email and password to keep your reading list across devices.',
    panelTitleNe: 'तपाईंको पढाइ, तपाईंको नियन्त्रणमा',
    panelTitleEn: 'Your reading, under your control',
    panelBodyNe: 'सुरक्षित समाचार, पढाइ इतिहास र विषय प्राथमिकता एकै ठाउँमा राख्नुहोस्।',
    panelBodyEn: 'Save stories, review reading history and manage topic preferences.',
  },
  recover: {
    formTitleNe: 'पासवर्ड रिसेट',
    formTitleEn: 'Reset password',
    formBodyNe: 'खातामा प्रयोग भएको इमेल लेख्नुहोस्।',
    formBodyEn: 'Enter the email used for your account.',
    panelTitleNe: 'रिकभरी लिंक इमेलमा आउँछ',
    panelTitleEn: 'Recovery happens by email',
    panelBodyNe: 'खाता भएमा एकपटक प्रयोग हुने रिसेट लिंक पठाइन्छ।',
    panelBodyEn: 'If the account exists, we send a single-use reset link.',
  },
  reset: {
    formTitleNe: 'नयाँ पासवर्ड राख्नुहोस्',
    formTitleEn: 'Choose a new password',
    formBodyNe: 'कम्तीमा ८ अक्षरको बलियो पासवर्ड प्रयोग गर्नुहोस्।',
    formBodyEn: 'Use a strong password with at least 8 characters.',
    panelTitleNe: 'रिकभरी लिंक सुरक्षित रूपमा जाँचिन्छ',
    panelTitleEn: 'The recovery link is verified',
    panelBodyNe: 'म्याद सकिएको वा अपूर्ण लिंकबाट पासवर्ड परिवर्तन हुँदैन।',
    panelBodyEn: 'Expired or incomplete recovery links cannot change a password.',
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
    panelTitleNe: 'न्युजरुम भूमिका निमन्त्रणाबाट मात्र',
    panelTitleEn: 'Newsroom roles are invitation-only',
    panelBodyNe: 'पाठक खाताबाट स्वतः पत्रकार वा सम्पादक पहुँच खुल्दैन।',
    panelBodyEn: 'A reader account never becomes a reporter or editor account automatically.',
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
    <main className="reader-auth-shell min-h-dvh bg-surface px-3 py-4 sm:px-5 sm:py-7" lang={lang}>
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-hidden border-y border-rule bg-surface sm:min-h-[calc(100dvh-3.5rem)] sm:border lg:grid-cols-[minmax(0,0.94fr)_minmax(26rem,1.06fr)]">
        <aside className="relative hidden min-h-[42rem] overflow-hidden border-r border-rule bg-surface-raised p-8 lg:flex lg:flex-col">
          <Link
            href={localizeHref(locale, '/')}
            className="relative z-10 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}
          >
            <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          </Link>

          <div className="relative z-10 mt-10 max-w-md">
            <p className="text-caption font-extrabold text-brand-strong">
              {ne ? 'पाठक खाता' : 'Reader account'}
            </p>
            <h2 className="mt-2 text-pretty font-display text-[clamp(2rem,4vw,3.4rem)] font-black leading-[1.08] text-ink">
              {ne ? content.panelTitleNe : content.panelTitleEn}
            </h2>
            <p className="mt-4 max-w-[40ch] text-body leading-relaxed text-ink-soft">
              {ne ? content.panelBodyNe : content.panelBodyEn}
            </p>
          </div>

          <div className="mt-auto pt-8">
            <AuthIllustration variant="reader" className="mx-auto max-w-[38rem]" />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-surface px-4 py-5 sm:px-8 sm:py-7 lg:px-10 lg:py-8" aria-labelledby="reader-auth-title">
          <div className="flex items-center justify-between gap-4 border-b border-rule pb-4 lg:hidden">
            <Link href={localizeHref(locale, '/')} aria-label={ne ? 'नागरिक वाच गृहपृष्ठ' : 'Nagarik Watch home'}>
              <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} compact />
            </Link>
            <span className="text-caption font-bold text-mute">{ne ? 'पाठक सेवा' : 'Reader service'}</span>
          </div>

          {showRoleSwitch ? (
            <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-caption font-bold lg:mt-0" aria-label={ne ? 'खाता प्रकार' : 'Account type'}>
              <Link href={localizeHref(locale, '/auth/login')} className="text-brand-strong underline decoration-2 underline-offset-4">
                {ne ? 'पाठक' : 'Reader'}
              </Link>
              <Link href={localizeHref(locale, '/journalist/login')} className="text-ink-soft hover:text-ink">
                {ne ? 'पत्रकार डेस्क' : 'Reporter desk'}
              </Link>
            </nav>
          ) : null}

          <div className="my-auto py-8 sm:py-12">
            <p className="text-caption font-bold text-mute">{ne ? 'नागरिक वाच खाता' : 'Nagarik Watch account'}</p>
            <h1 id="reader-auth-title" className="mt-2 text-pretty font-display text-[clamp(2.15rem,5vw,3.6rem)] font-black leading-[1.08] text-ink">
              {ne ? content.formTitleNe : content.formTitleEn}
            </h1>
            <p className="mt-3 max-w-[44ch] text-body leading-relaxed text-ink-soft">
              {ne ? content.formBodyNe : content.formBodyEn}
            </p>
            <div className="mt-7 max-w-[30rem]">{children}</div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-caption text-mute">
            <p>{ne ? 'समाचार पढ्न खाता चाहिँदैन।' : 'No account is required to read the news.'}</p>
            <Link href={localizeHref(locale, '/privacy')} className="font-bold text-ink-soft hover:text-brand-strong">
              {ne ? 'गोपनीयता' : 'Privacy'}
            </Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
