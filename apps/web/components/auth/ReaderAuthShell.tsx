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
    formBodyNe: 'सुरक्षित समाचार र व्यक्तिगत सिफारिसका लागि खाता प्रयोग गर्नुहोस्।',
    formBodyEn: 'Sign in to access saved stories and personalized recommendations.',
    panelTitleNe: 'पढाइ सधैं निःशुल्क र खुला',
    panelTitleEn: 'Reading stays 100% free',
    panelBodyNe: 'नागरिक वाचमा समाचार पढ्न खाता बनाउनु वा साइन इन गर्नु अनिवार्य छैन।',
    panelBodyEn:
      'Accounts are strictly optional for saving bookmarks. You never need an account just to read.',
  },
  signup: {
    formTitleNe: 'नयाँ पाठक खाता बनाउनुहोस्',
    formTitleEn: 'Create reader account',
    formBodyNe: 'निःशुल्क खाता। मनपरेका समाचार सुरक्षित गर्न र पछि पढ्न।',
    formBodyEn: 'Free reader account to save articles and sync across devices.',
    panelTitleNe: 'स्वतन्त्र नेपाली पत्रकारिता',
    panelTitleEn: 'Independent Nepali Journalism',
    panelBodyNe: 'सार्वजनिक सरोकारका तथ्य र विश्वसनीय रिपोर्टिङ।',
    panelBodyEn: 'Civic scrutiny, verified facts and public-interest reporting.',
  },
  recover: {
    formTitleNe: 'पासवर्ड पुनःप्राप्ति',
    formTitleEn: 'Reset password',
    formBodyNe: 'दर्ता भएको इमेल ठेगाना लेख्नुहोस्।',
    formBodyEn: 'Enter your registered email address.',
    panelTitleNe: 'खाता सुरक्षा',
    panelTitleEn: 'Account Security',
    panelBodyNe: 'पासवर्ड रिसेट लिंक तपाईंको इमेलमा पठाइनेछ।',
    panelBodyEn: 'A secure single-use recovery link will be sent to your email.',
  },
  reset: {
    formTitleNe: 'नयाँ पासवर्ड राख्नुहोस्',
    formTitleEn: 'Set new password',
    formBodyNe: 'कम्तीमा ८ अक्षरको बलियो पासवर्ड राख्नुहोस्।',
    formBodyEn: 'Choose a strong password with at least 8 characters.',
    panelTitleNe: 'सुरक्षित लिंक',
    panelTitleEn: 'Secure Link',
    panelBodyNe: 'यो लिंक एक पटक मात्र प्रयोग गर्न सकिनेछ।',
    panelBodyEn: 'This recovery link expires after single use.',
  },
  change: {
    formTitleNe: 'पासवर्ड परिवर्तन',
    formTitleEn: 'Change password',
    formBodyNe: 'हालको पासवर्ड पुष्टि गर्नुहोस्।',
    formBodyEn: 'Confirm your current password first.',
    panelTitleNe: 'सुरक्षा नियन्त्रण',
    panelTitleEn: 'Security Controls',
    panelBodyNe: 'अन्य उपकरणका सक्रिय सत्रहरू बन्द हुनेछन्।',
    panelBodyEn: 'Sessions on other devices will be invalidated.',
  },
  invite: {
    formTitleNe: 'न्युजरुम निमन्त्रणा स्वीकार',
    formTitleEn: 'Accept newsroom invite',
    formBodyNe: 'निमन्त्रणा आएको इमेलसँग मिलाउनुहोस्।',
    formBodyEn: 'Match the email address that received the invitation.',
    panelTitleNe: 'न्युजरुम डेस्क',
    panelTitleEn: 'Newsroom Desk',
    panelBodyNe: 'सम्पादकीय भूमिका सम्पादकद्वारा दिइन्छ।',
    panelBodyEn: 'Editorial permissions are granted by senior editors.',
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

  return (
    <div className="min-h-[85vh] bg-surface flex flex-col justify-center py-8 sm:py-12">
      <div className="mx-auto w-full max-w-4xl px-3 sm:px-6">
        <div className="grid overflow-hidden rounded-2xl border border-rule bg-surface-raised shadow-card lg:grid-cols-[1.1fr_1fr]">
          {/* Left: Editorial & Civic Reassurance Panel */}
          <aside className="hidden flex-col justify-between bg-chrome p-8 text-on-chrome border-r border-chrome-rule lg:flex">
            <div>
              <Link
                href={localizeHref(locale, '/')}
                className="inline-block transition-opacity hover:opacity-90"
              >
                <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} tone="chrome" />
              </Link>

              <div className="mt-12">
                <span className="inline-flex rounded-full bg-brand-tint px-3 py-0.5 text-caption font-bold text-brand-strong uppercase">
                  {ne ? 'नागरिक सेवा' : 'Public Service'}
                </span>
                <h2
                  className="mt-4 font-display text-[1.75rem] font-black leading-tight text-on-chrome"
                  lang={ne ? 'ne' : 'en'}
                >
                  {ne ? content.panelTitleNe : content.panelTitleEn}
                </h2>
                <span className="mt-3 block h-1 w-12 rounded bg-brand" aria-hidden="true" />
                <p
                  className="mt-4 text-body leading-relaxed text-on-chrome-soft"
                  lang={ne ? 'ne' : 'en'}
                >
                  {ne ? content.panelBodyNe : content.panelBodyEn}
                </p>
              </div>
            </div>

            <div className="border-t border-chrome-rule/60 pt-4 text-caption text-on-chrome-soft">
              <p lang={ne ? 'ne' : 'en'}>
                {ne
                  ? 'नागरिक वाच • स्वतन्त्र नेपाली डिजिटल समाचार'
                  : 'Nagarik Watch • Independent Nepali News'}
              </p>
            </div>
          </aside>

          {/* Right: Auth Form Surface */}
          <div className="p-6 sm:p-8 flex flex-col justify-center bg-surface">
            <div className="mb-6 lg:hidden">
              <Link href={localizeHref(locale, '/')} className="inline-block">
                <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
              </Link>
            </div>

            {showRoleSwitch ? (
              <nav
                className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-rule pb-3.5"
                aria-label={ne ? 'लगइन प्रकार' : 'Sign-in type'}
              >
                <Link
                  href={localizeHref(locale, '/auth/login')}
                  className="rounded-full bg-brand px-3 py-1 text-caption font-extrabold text-paper shadow-sm"
                >
                  {ne ? 'पाठक खाता' : 'Reader'}
                </Link>
                <Link
                  href={localizeHref(locale, '/journalist/login')}
                  className="rounded-full border border-rule px-3 py-1 text-caption font-semibold text-ink-soft hover:border-brand hover:text-brand-strong transition-colors"
                >
                  {ne ? 'पत्रकार डेस्क' : 'Reporter'}
                </Link>
                <Link
                  href="/admin/login"
                  className="rounded-full border border-rule px-3 py-1 text-caption font-semibold text-ink-soft hover:border-brand hover:text-brand-strong transition-colors"
                >
                  {ne ? 'न्युजरुम एडमिन' : 'Admin'}
                </Link>
              </nav>
            ) : null}

            <h1
              className="font-display text-[1.45rem] sm:text-[1.65rem] font-black text-ink"
              lang={ne ? 'ne' : 'en'}
            >
              {ne ? content.formTitleNe : content.formTitleEn}
            </h1>
            <p className="mt-1.5 text-caption sm:text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {ne ? content.formBodyNe : content.formBodyEn}
            </p>

            <div className="mt-5">{children}</div>

            <p
              className="mt-6 border-t border-rule pt-4 text-center text-caption text-mute"
              lang={ne ? 'ne' : 'en'}
            >
              {ne ? (
                <>
                  समाचार पढ्न खाता चाहिँदैन।{' '}
                  <Link
                    href={localizeHref(locale, '/')}
                    className="font-bold text-brand-strong underline"
                  >
                    गृहपृष्ठ फर्कनुहोस्
                  </Link>
                </>
              ) : (
                <>
                  No account needed to read.{' '}
                  <Link
                    href={localizeHref(locale, '/')}
                    className="font-bold text-brand-strong underline"
                  >
                    Return Home
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
