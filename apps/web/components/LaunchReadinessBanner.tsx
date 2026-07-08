import type { Locale } from '@nagarikwatch/db'
import { getLaunchIssues } from '@/lib/launch-readiness'

export function LaunchReadinessBanner({ locale }: { locale: Locale }) {
  const issues = getLaunchIssues()
  const status = process.env.NEXT_PUBLIC_LAUNCH_STATUS ?? 'preview'
  const blockers = issues.filter((issue) => issue.severity === 'blocker')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  const lang = locale === 'en' ? 'en' : 'ne'

  if (status === 'live' && blockers.length === 0) return null

  return (
    <section
      className="border-b border-rule bg-brand-tint"
      lang={lang}
      aria-label={locale === 'en' ? 'Launch status' : 'लन्च अवस्था'}
    >
      <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-3 text-meta text-ink-soft lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-bold text-brand-strong">
            {locale === 'en'
              ? status === 'live'
                ? 'Launch blockers remain'
                : 'Preview deployment'
              : status === 'live'
                ? 'लन्च अवरोध बाँकी छन्'
                : 'पूर्वावलोकन डिप्लोयमेन्ट'}
          </p>
          <p className="mt-1 max-w-3xl">
            {locale === 'en'
              ? 'Do not treat this as a public newsroom launch until the required publication, CMS and provider settings are complete.'
              : 'प्रकाशन, CMS र प्रदायक सेटिङ पूरा नभएसम्म यसलाई सार्वजनिक न्यूजरुम लन्च नमान्नुहोस्।'}
          </p>
        </div>
        {issues.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {[...blockers, ...warnings].slice(0, 4).map((issue) => (
              <li
                key={issue.key}
                className="rounded-full border border-rule bg-surface px-3 py-1 text-caption font-semibold text-ink"
              >
                {locale === 'en' ? issue.labelEn : issue.labelNe}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
