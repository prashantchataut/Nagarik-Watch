import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

type AuthMode = 'login' | 'signup' | 'recover' | 'reset' | 'change' | 'invite'

type AuthCopy = {
  eyebrowNe: string
  eyebrowEn: string
  titleNe: string
  titleEn: string
  bodyNe: string
  bodyEn: string
  formTitleNe: string
  formTitleEn: string
  formBodyNe: string
  formBodyEn: string
}

const copy: Record<AuthMode, AuthCopy> = {
  login: {
    eyebrowNe: 'पाठक खाता', eyebrowEn: 'Reader account',
    titleNe: 'आफ्नो समाचार अनुभवमा फर्कनुहोस्।', titleEn: 'Return to your reading experience.',
    bodyNe: 'सुरक्षित समाचार, पढाइ इतिहास र व्यक्तिगत सिफारिस एउटै खातामा।', bodyEn: 'Saved stories, reading history and personal recommendations in one account.',
    formTitleNe: 'लगइन गर्नुहोस्', formTitleEn: 'Sign in',
    formBodyNe: 'संग्रह र पढाइ इतिहास हेर्न आफ्नो इमेल प्रयोग गर्नुहोस्।', formBodyEn: 'Use your email to access saved stories and reading history.',
  },
  signup: {
    eyebrowNe: 'नयाँ पाठक खाता', eyebrowEn: 'New reader account',
    titleNe: 'आफूलाई महत्त्वपूर्ण समाचार सुरक्षित राख्नुहोस्।', titleEn: 'Keep the reporting that matters to you.',
    bodyNe: 'खाता निःशुल्क छ। समाचार पढ्न खाता आवश्यक छैन, तर संग्रह र सिफारिसका लागि उपयोगी हुन्छ।', bodyEn: 'Accounts are free. Reading never requires an account, but saving and recommendations do.',
    formTitleNe: 'खाता बनाउनुहोस्', formTitleEn: 'Create your account',
    formBodyNe: 'केही सेकेन्डमा सुरु गर्नुहोस्।', formBodyEn: 'Get started in a few seconds.',
  },
  recover: {
    eyebrowNe: 'खाता पुनःप्राप्ति', eyebrowEn: 'Account recovery',
    titleNe: 'पासवर्ड बिर्सनु समस्या होइन।', titleEn: 'A forgotten password should not lock you out.',
    bodyNe: 'दर्ता भएको इमेलमा सीमित समयका लागि सुरक्षित लिंक पठाइन्छ। हामी खाता छ कि छैन भनेर सार्वजनिक रूपमा बताउँदैनौँ।', bodyEn: 'We send a time-limited secure link to registered addresses without revealing whether an account exists.',
    formTitleNe: 'पासवर्ड पुनः सेट गर्नुहोस्', formTitleEn: 'Reset your password',
    formBodyNe: 'खातामा प्रयोग भएको इमेल लेख्नुहोस्।', formBodyEn: 'Enter the email used for your account.',
  },
  reset: {
    eyebrowNe: 'सुरक्षित लिंक', eyebrowEn: 'Secure link',
    titleNe: 'अब बलियो नयाँ पासवर्ड बनाउनुहोस्।', titleEn: 'Choose a strong new password.',
    bodyNe: 'लिंक एकपटक र सीमित समयका लागि मात्र प्रयोग गर्न मिल्छ। परिवर्तनपछि पुराना सत्र बन्द हुन्छन्।', bodyEn: 'The link is single-use and time-limited. Existing sessions are revoked after the reset.',
    formTitleNe: 'नयाँ पासवर्ड', formTitleEn: 'New password',
    formBodyNe: 'कम्तीमा ८ अक्षरको फरक पासवर्ड प्रयोग गर्नुहोस्।', formBodyEn: 'Use a distinct password with at least 8 characters.',
  },
  change: {
    eyebrowNe: 'खाता सुरक्षा', eyebrowEn: 'Account security',
    titleNe: 'आफ्नो खाता सुरक्षित राख्नुहोस्।', titleEn: 'Keep your account secure.',
    bodyNe: 'पासवर्ड परिवर्तन गर्दा अन्य उपकरणमा खुलेका सत्र बन्द हुन्छन्।', bodyEn: 'Changing your password revokes sessions on other devices.',
    formTitleNe: 'पासवर्ड परिवर्तन', formTitleEn: 'Change password',
    formBodyNe: 'हालको पासवर्ड पुष्टि गरेर नयाँ पासवर्ड सुरक्षित गर्नुहोस्।', formBodyEn: 'Confirm your current password, then save a new one.',
  },
  invite: {
    eyebrowNe: 'न्युजरुम निमन्त्रणा', eyebrowEn: 'Newsroom invitation',
    titleNe: 'जिम्मेवारीसहित न्युजरुममा प्रवेश गर्नुहोस्।', titleEn: 'Join the newsroom with a verified role.',
    bodyNe: 'निमन्त्रणा एकपटक, सीमित समय र तोकिएको इमेलबाट मात्र स्वीकार गर्न सकिन्छ।', bodyEn: 'Invitations are single-use, time-limited and bound to the invited email address.',
    formTitleNe: 'निमन्त्रणा स्वीकार', formTitleEn: 'Accept invitation',
    formBodyNe: 'आफ्नो खाताको इमेल निमन्त्रणा आएको इमेलसँग मिलेको सुनिश्चित गर्नुहोस्।', formBodyEn: 'Make sure your account email matches the address that received the invitation.',
  },
}

export function ReaderAuthShell({ locale, mode, children }: { locale: 'ne' | 'en'; mode: AuthMode; children: ReactNode }) {
  const ne = locale === 'ne'
  const content = copy[mode]
  return <main className="auth-shell">
    <section className="auth-editorial" aria-label={ne ? 'पाठक खाता परिचय' : 'Reader account introduction'}>
      <a href={ne ? '/' : '/en'} className="relative z-10 w-fit"><Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} /></a>
      <div className="relative z-10 max-w-xl">
        <p className="text-meta font-extrabold uppercase tracking-[.16em] text-[oklch(0.82_0.09_28)]" lang={ne ? 'ne' : 'en'}>{ne ? content.eyebrowNe : content.eyebrowEn}</p>
        <h1 className="mt-5 font-display text-[clamp(2.8rem,5vw,4.9rem)] font-extrabold leading-[.98] text-[oklch(0.97_0.005_28)]" lang={ne ? 'ne' : 'en'}>{ne ? content.titleNe : content.titleEn}</h1>
        <p className="mt-6 max-w-lg text-body-lg leading-relaxed text-[oklch(0.82_0.012_28)]" lang={ne ? 'ne' : 'en'}>{ne ? content.bodyNe : content.bodyEn}</p>
      </div>
      <p className="relative z-10 border-t border-[oklch(0.5_0.035_28)] pt-6 text-meta text-[oklch(0.82_0.012_28)]" lang={ne ? 'ne' : 'en'}>{ne ? 'तपाईंको इमेल विज्ञापनदातालाई बेचिँदैन।' : 'Your email is never sold to advertisers.'}</p>
    </section>
    <section className="auth-form-column">
      <div className="auth-form-wrap">
        <a href={ne ? '/' : '/en'} className="mb-10 block w-fit lg:hidden"><Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} /></a>
        <p className="admin-eyebrow" lang={ne ? 'ne' : 'en'}>{ne ? content.eyebrowNe : content.eyebrowEn}</p>
        <h2 className="mt-2 font-display text-[2.35rem] font-extrabold leading-tight text-ink" lang={ne ? 'ne' : 'en'}>{ne ? content.formTitleNe : content.formTitleEn}</h2>
        <p className="mt-3 text-body leading-relaxed text-ink-soft" lang={ne ? 'ne' : 'en'}>{ne ? content.formBodyNe : content.formBodyEn}</p>
        <div className="auth-form-surface">{children}</div>
        <p className="mt-8 text-caption text-mute" lang={ne ? 'ne' : 'en'}>{ne ? 'समाचार पढ्न खाता आवश्यक छैन।' : 'You never need an account just to read the news.'}</p>
      </div>
    </section>
  </main>
}
