import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

export function ReaderAuthShell({ locale, mode, children }: { locale: 'ne' | 'en'; mode: 'login' | 'signup'; children: ReactNode }) {
  const ne = locale === 'ne'
  const title = mode === 'login'
    ? (ne ? 'आफ्नो समाचार अनुभवमा फर्कनुहोस्।' : 'Return to your reading experience.')
    : (ne ? 'आफूलाई महत्त्वपूर्ण समाचार सुरक्षित राख्नुहोस्।' : 'Keep the reporting that matters to you.')
  const body = mode === 'login'
    ? (ne ? 'सुरक्षित समाचार, पढाइ इतिहास र व्यक्तिगत सिफारिस एउटै खातामा।' : 'Saved stories, reading history and personal recommendations in one account.')
    : (ne ? 'खाता निःशुल्क छ। समाचार पढ्न खाता आवश्यक छैन, तर संग्रह र सिफारिसका लागि उपयोगी हुन्छ।' : 'Accounts are free. Reading never requires an account, but saving and recommendations do.')
  return <main className="auth-shell">
    <section className="auth-editorial" aria-label={ne ? 'पाठक खाता परिचय' : 'Reader account introduction'}>
      <a href={ne ? '/ne' : '/en'} className="relative z-10 w-fit"><Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} /></a>
      <div className="relative z-10 max-w-xl">
        <p className="text-meta font-extrabold uppercase tracking-[.16em] text-[oklch(0.82_0.09_28)]">{ne ? 'पाठक खाता' : 'Reader account'}</p>
        <h1 className="mt-5 font-display text-[clamp(2.8rem,5vw,4.9rem)] font-extrabold leading-[.98] text-[oklch(0.97_0.005_28)]" lang={ne ? 'ne' : 'en'}>{title}</h1>
        <p className="mt-6 max-w-lg text-body-lg leading-relaxed text-[oklch(0.82_0.012_28)]" lang={ne ? 'ne' : 'en'}>{body}</p>
      </div>
      <p className="relative z-10 border-t border-[oklch(0.5_0.035_28)] pt-6 text-meta text-[oklch(0.82_0.012_28)]" lang={ne ? 'ne' : 'en'}>{ne ? 'तपाईंको इमेल विज्ञापनदातालाई बेचिँदैन।' : 'Your email is never sold to advertisers.'}</p>
    </section>
    <section className="auth-form-column">
      <div className="auth-form-wrap">
        <a href={ne ? '/ne' : '/en'} className="mb-10 block w-fit lg:hidden"><Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} /></a>
        <p className="admin-eyebrow" lang={ne ? 'ne' : 'en'}>{mode === 'login' ? (ne ? 'पुनः स्वागत छ' : 'Welcome back') : (ne ? 'नयाँ पाठक खाता' : 'New reader account')}</p>
        <h2 className="mt-2 font-display text-[2.35rem] font-extrabold leading-tight text-ink" lang={ne ? 'ne' : 'en'}>{mode === 'login' ? (ne ? 'लगइन गर्नुहोस्' : 'Sign in') : (ne ? 'खाता बनाउनुहोस्' : 'Create your account')}</h2>
        <p className="mt-3 text-body leading-relaxed text-ink-soft" lang={ne ? 'ne' : 'en'}>{mode === 'login' ? (ne ? 'संग्रह र पढाइ इतिहास हेर्न आफ्नो इमेल प्रयोग गर्नुहोस्।' : 'Use your email to access saved stories and reading history.') : (ne ? 'केही सेकेन्डमा सुरु गर्नुहोस्।' : 'Get started in a few seconds.')}</p>
        <div className="auth-form-surface">{children}</div>
        <p className="mt-8 text-caption text-mute" lang={ne ? 'ne' : 'en'}>{ne ? 'समाचार पढ्न खाता आवश्यक छैन।' : 'You never need an account just to read the news.'}</p>
      </div>
    </section>
  </main>
}
