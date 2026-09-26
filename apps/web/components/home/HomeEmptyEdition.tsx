import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'

/**
 * The front page when there is no edition to show.
 *
 * There are two ways to get here and they are not the same thing, which is the
 * bug this component used to carry. `getHomepage()` resolves to `null` when the
 * source is healthy and simply has nothing published — the repo's standing
 * policy is that the newsroom starts empty and no journalism ships as fixtures,
 * so that is the *normal* state of a fresh install and of the site before
 * launch. It *throws* when the source is actually unreachable. Both used to
 * render one message that said the edition "cannot be shown right now", so a
 * correctly-working pre-launch site reported itself as broken, and a real
 * Payload outage was indistinguishable from an ordinary quiet morning.
 *
 * `reason` separates them:
 *
 *   'empty'       — nothing published yet. Not a fault. Say so plainly and send
 *                   the reader to the surfaces that carry real data without a
 *                   corpus: पात्रो, the market boards, the latest desk.
 *   'unavailable' — the source failed twice. This is the service notice, and it
 *                   stays deliberately compact: a status message, not a hero.
 *
 * Both shapes keep `#empty-edition-title` and a ताजा समाचार link, which
 * e2e/homepage.spec.ts asserts, and both render exactly one `h1`.
 */
export function HomeEmptyEdition({
  locale,
  reason = 'unavailable',
}: {
  locale: Locale
  reason?: 'empty' | 'unavailable'
}) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  if (reason === 'unavailable') {
    return (
      <div className="mx-auto max-w-page px-3 py-10 sm:px-4 sm:py-14" lang={lang}>
        <section
          className="mx-auto max-w-xl border border-rule bg-surface-raised px-4 py-5 sm:px-6 sm:py-6"
          aria-labelledby="empty-edition-title"
        >
          <p className="text-caption font-bold text-brand-strong">
            {english ? 'Newsroom update' : 'समाचार कक्ष अपडेट'}
          </p>
          <h1
            id="empty-edition-title"
            className="mt-2 font-display text-h3 font-extrabold leading-snug text-ink"
          >
            {english
              ? 'Homepage stories cannot be shown right now.'
              : 'मुखपृष्ठका समाचार अहिले देखाउन सकिएन।'}
          </h1>
          <p className="mt-2 text-body leading-relaxed text-ink-soft">
            {english
              ? 'The edition is refreshing. The latest-news desk and the Nepali calendar remain available.'
              : 'संस्करण फेरि अद्यावधिक भइरहेको छ। ताजा समाचार र नेपाली पात्रो उपलब्ध छन्।'}
          </p>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-meta font-bold">
            <Link
              href={localizeHref(locale, '/latest')}
              className="text-brand-strong underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {english ? 'Latest news →' : 'ताजा समाचार →'}
            </Link>
            <Link
              href={patroEntryHref(locale)}
              className="text-ink underline-offset-4 hover:text-brand-strong hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {english ? 'Nepali calendar →' : 'नेपाली पात्रो →'}
            </Link>
          </p>
        </section>
      </div>
    )
  }

  // Nothing published yet. The desks below are the surfaces that hold real,
  // attributed data with an empty article store, so they are what the page
  // offers instead of an apology.
  const desks: {
    href: string
    titleNe: string
    titleEn: string
    noteNe: string
    noteEn: string
  }[] = [
    {
      href: patroEntryHref(locale),
      titleNe: 'नेपाली पात्रो',
      titleEn: 'Nepali calendar',
      noteNe: 'खगोलीय गणनाबाट तिथि, नक्षत्र र पर्व',
      noteEn: 'Tithi, nakshatra and festivals, computed astronomically',
    },
    {
      href: localizeHref(locale, '/market'),
      titleNe: 'बजार',
      titleEn: 'Market',
      noteNe: 'विदेशी मुद्रा, सुन–चाँदी र नेप्से',
      noteEn: 'Forex, bullion and NEPSE',
    },
    {
      href: localizeHref(locale, '/latest'),
      titleNe: 'ताजा समाचार',
      titleEn: 'Latest news',
      noteNe: 'प्रकाशित हुनेबित्तिकै यहाँ देखिन्छ',
      noteEn: 'Appears here as soon as it is published',
    },
    {
      href: localizeHref(locale, '/about'),
      titleNe: 'हाम्रो बारेमा',
      titleEn: 'About us',
      noteNe: 'सम्पादकीय नीति र टोली',
      noteEn: 'Editorial policy and the team',
    },
  ]

  return (
    <div className="mx-auto max-w-page px-3 py-10 sm:px-4 sm:py-14" lang={lang}>
      <section
        aria-labelledby="empty-edition-title"
        className="border-t-2 border-brand pt-5 sm:pt-6"
      >
        <p className="text-caption font-bold text-brand-strong">
          {english ? 'No edition yet' : 'संस्करण अझै प्रकाशित छैन'}
        </p>
        <h1
          id="empty-edition-title"
          className="mt-2 max-w-3xl font-display text-h2 font-extrabold leading-tight text-ink sm:text-h1"
        >
          {english
            ? 'The newsroom has not published its first edition yet.'
            : 'समाचार कक्षले पहिलो संस्करण अझै प्रकाशित गरेको छैन।'}
        </h1>
        <p className="mt-3 max-w-2xl text-body leading-relaxed text-ink-soft">
          {english
            ? 'Nothing is broken. This masthead carries no placeholder reporting by policy, so the front page stays empty until an editor publishes. The public-service desks below are live now.'
            : 'केही बिग्रिएको छैन। यस प्रकाशनमा नमुना समाचार राखिँदैन। सम्पादकले प्रकाशित नगरेसम्म मुखपृष्ठ रित्तै रहन्छ। तलका सार्वजनिक सेवा डेस्कहरू अहिले नै उपलब्ध छन्।'}
        </p>

        <ul className="mt-7 grid gap-px border border-rule bg-rule sm:mt-8 sm:grid-cols-2">
          {desks.map((desk) => (
            <li key={desk.href} className="bg-surface">
              <Link
                href={desk.href}
                className="group flex min-h-24 flex-col justify-center gap-1 px-4 py-4 transition-colors duration-fast ease-out-quint hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand sm:px-5 sm:py-5"
              >
                <span className="font-display text-h3 font-extrabold text-ink group-hover:text-brand-strong">
                  {english ? desk.titleEn : desk.titleNe}
                  <span aria-hidden="true" className="text-brand">
                    {' '}
                    →
                  </span>
                </span>
                <span className="text-meta leading-relaxed text-ink-soft">
                  {english ? desk.noteEn : desk.noteNe}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
