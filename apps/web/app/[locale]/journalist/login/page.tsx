import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistLoginForm } from '@/components/journalist/JournalistLoginForm'

export const metadata: Metadata = {
  title: 'Journalist Login',
  robots: { index: false, follow: false },
}

type Params = { locale: string }

export default async function JournalistLoginPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'

  return (
    <main className="newsroom-login" lang={ne ? 'ne' : 'en'}>
      <div className="newsroom-login__mast">
        <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        <span>{ne ? 'सुरक्षित रिपोर्टर डेस्क' : 'Secure reporter desk'}</span>
      </div>
      <div className="newsroom-login__grid">
        <section className="newsroom-login__brief">
          <p className="editorial-kicker" lang="en">Journalist workspace</p>
          <h1>{ne ? 'समाचार लेख्ने, प्रमाण जोड्ने र समीक्षा पठाउने एउटै डेस्क।' : 'Write, evidence and submit reporting from one focused desk.'}</h1>
          <p>{ne
            ? 'यो सार्वजनिक पाठक खाता वा system admin होइन। पत्रकार र योगदानकर्ताले आफ्नै ड्राफ्ट, सम्पादकीय प्रतिक्रिया, ट्याग र सूचना प्रस्ताव यहाँ व्यवस्थापन गर्छन्।'
            : 'This is separate from reader accounts and system administration. Reporters manage their own drafts, editorial feedback, tags and alert proposals here.'}</p>
          <dl>
            <div><dt>01</dt><dd>{ne ? 'आफ्नै ड्राफ्टमा मात्र पहुँच' : 'Access only your assigned drafts'}</dd></div>
            <div><dt>02</dt><dd>{ne ? 'स्रोत र प्रमाण अनिवार्य' : 'Evidence-aware review workflow'}</dd></div>
            <div><dt>03</dt><dd>{ne ? 'प्रकाशन अधिकार सम्पादकसँग' : 'Editors retain publishing authority'}</dd></div>
          </dl>
        </section>
        <section className="newsroom-login__form">
          <header>
            <p className="editorial-kicker" lang="en">Newsroom access</p>
            <h2>{ne ? 'आफ्नो काममा फर्कनुहोस्' : 'Return to your desk'}</h2>
            <p>{ne ? 'पत्रकार वा योगदानकर्ता भूमिका भएको इमेल प्रयोग गर्नुहोस्।' : 'Use an email with journalist or contributor access.'}</p>
          </header>
          <JournalistLoginForm locale={locale} />
          <footer>
            <Link href={localizeHref(locale, '/auth/forgot-password')}>{ne ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}</Link>
            <Link href={localizeHref(locale, '/auth/login')}>{ne ? 'पाठक लगइन' : 'Reader login'}</Link>
          </footer>
        </section>
      </div>
    </main>
  )
}
