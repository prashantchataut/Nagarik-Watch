'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useId, useState, type ReactNode } from 'react'
import type { Category, Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref, pathsMatch, swapLocale } from '@/lib/i18n/locales'
import { patroEntryHref } from '@/lib/calendar-host'
import { LogoMark } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { STATIC_HUBS, PROVINCES } from '@/lib/site'
import type { AccountKind } from '@/lib/account-identity'
import { OverlayDialog } from '@/components/overlays/OverlayDialog'
import {
  IconBookmark,
  IconCalendar,
  IconChart,
  IconClose,
  IconDesk,
  IconMenu,
  IconUser,
} from '@/components/icons/PortalIcons'

type MobileNavProps = {
  locale: Locale
  navCategories: Category[]
  account?: {
    kind: AccountKind
    displayName: string
    kindLabel: string
    roleLabel: string
    profileHref: string
  } | null
}

const ICON_BTN =
  'inline-flex h-11 w-11 items-center justify-center rounded border border-transparent text-on-chrome transition-colors duration-fast ease-out-quint hover:border-chrome-rule hover:bg-surface-raised hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const SHEET_ICON_BTN =
  'inline-flex h-11 w-11 items-center justify-center rounded border border-rule text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'

const SHEET_LINK =
  'flex min-h-11 items-center rounded-sm px-2 py-2 text-body font-semibold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:bg-brand-tint/40 hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand'

const SHEET_LINK_ROW = `${SHEET_LINK} gap-3`

export function MobileNav({ locale, navCategories, account = null }: MobileNavProps) {
  const dict = getDictionary(locale)
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  const dialogId = useId()
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const homeHref = localizeHref(locale, '/')
  const latestHref = localizeHref(locale, '/latest')
  const savedHref = localizeHref(locale, '/saved')
  const readerCornerHref = localizeHref(locale, '/reader-corner')
  const toggleHref = swapLocale(pathname)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.openMenu}
        aria-expanded={open}
        aria-controls={dialogId}
        className={ICON_BTN}
      >
        <IconMenu width={21} height={21} />
      </button>

      <OverlayDialog
        id={dialogId}
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={dict.primaryNav}
        variant="navigation"
      >
        <div className="flex h-[min(88dvh,46rem)] flex-col sm:h-dvh" lang={lang}>
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-rule bg-surface-raised px-4">
            <span className="flex min-w-0 items-center gap-2.5">
              <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-8 w-8 shrink-0" />
              <span className="truncate font-display text-h3 font-extrabold text-ink" lang="ne">
                {dict.siteName}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dict.closeMenu}
              className={SHEET_ICON_BTN}
              autoFocus
            >
              <IconClose width={19} height={19} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
            <DrawerSection label={en ? 'News desks' : 'समाचार विभाग'} lang={lang}>
              <li>
                <Link
                  href={homeHref}
                  onClick={() => setOpen(false)}
                  aria-current={pathsMatch(pathname, homeHref) ? 'page' : undefined}
                  className={SHEET_LINK}
                >
                  {dict.home}
                </Link>
              </li>
              <li>
                <Link
                  href={latestHref}
                  onClick={() => setOpen(false)}
                  aria-current={pathsMatch(pathname, latestHref) ? 'page' : undefined}
                  className={SHEET_LINK}
                >
                  {dict.navLatest}
                </Link>
              </li>
              {navCategories.map((category) => {
                const label = en && category.nameEn ? category.nameEn : category.nameNe
                const categoryLang = en && category.nameEn ? 'en' : 'ne'
                const href = localizeHref(locale, `/${category.slug}`)
                return (
                  <li key={category.slug}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      lang={categoryLang}
                      aria-current={pathsMatch(pathname, href) ? 'page' : undefined}
                      className={SHEET_LINK}
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
              <li>
                <Link
                  href={localizeHref(locale, '/fact-check')}
                  onClick={() => setOpen(false)}
                  aria-current={pathname.includes('/fact-check') ? 'page' : undefined}
                  className={SHEET_LINK}
                >
                  {en ? 'Fact check' : 'तथ्य-जाँच'}
                </Link>
              </li>
            </DrawerSection>

            <DrawerSection label={en ? 'Useful services' : 'उपयोगी सेवाहरू'} lang={lang}>
              <li className="grid grid-cols-2 gap-2 py-2">
                <UtilityLink
                  href={patroEntryHref(locale)}
                  onClick={() => setOpen(false)}
                  icon={<IconCalendar width={17} height={17} />}
                  label={en ? 'Patro' : 'पात्रो'}
                />
                <UtilityLink
                  href={localizeHref(locale, '/market')}
                  onClick={() => setOpen(false)}
                  icon={<IconChart width={17} height={17} />}
                  label={en ? 'Markets' : 'बजार'}
                />
                <UtilityLink
                  href={localizeHref(locale, '/preeti-unicode')}
                  onClick={() => setOpen(false)}
                  icon={<span aria-hidden="true">क</span>}
                  label={en ? 'Unicode' : 'युनिकोड'}
                />
                <UtilityLink
                  href={localizeHref(locale, '/utilities/date-converter')}
                  onClick={() => setOpen(false)}
                  icon={<span aria-hidden="true">⇄</span>}
                  label={en ? 'Date convert' : 'मिति रूपान्तरण'}
                />
              </li>
            </DrawerSection>

            <DrawerSection label={en ? 'Provinces' : 'प्रदेश समाचार'} lang={lang}>
              <li className="grid grid-cols-2 gap-x-3">
                {PROVINCES.map((province) => (
                  <Link
                    key={province.slug}
                    href={localizeHref(locale, `/province/${province.slug}`)}
                    onClick={() => setOpen(false)}
                    className={SHEET_LINK}
                  >
                    {en ? province.nameEn : province.nameNe}
                  </Link>
                ))}
              </li>
            </DrawerSection>

            <DrawerSection
              label={account ? (en ? 'Your account' : 'तपाईंको खाता') : en ? 'Reader' : 'पाठक'}
              lang={lang}
            >
              <li>
                <Link
                  href={account?.profileHref ?? localizeHref(locale, '/auth/login')}
                  onClick={() => setOpen(false)}
                  className={SHEET_LINK_ROW}
                >
                  <IconUser width={17} height={17} />
                  <span>
                    {account
                      ? account.kind === 'reader'
                        ? en
                          ? 'My account'
                          : 'मेरो खाता'
                        : en
                          ? 'Account'
                          : 'खाता'
                      : en
                        ? 'Sign in'
                        : 'लगइन'}
                  </span>
                </Link>
              </li>
              <li>
                <Link href={savedHref} onClick={() => setOpen(false)} className={SHEET_LINK_ROW}>
                  <IconBookmark width={17} height={17} />
                  <span>{en ? 'Saved stories' : 'सुरक्षित समाचार'}</span>
                </Link>
              </li>
              <li>
                <Link
                  href={readerCornerHref}
                  onClick={() => setOpen(false)}
                  className={SHEET_LINK_ROW}
                >
                  <IconDesk width={17} height={17} />
                  <span>{en ? 'Reader corner' : 'पाठक मञ्च'}</span>
                </Link>
              </li>
              <li className="flex min-h-14 items-center justify-between gap-4 px-2 py-2">
                <span className="text-body font-semibold text-ink">{en ? 'Theme' : 'थिम'}</span>
                <ThemeToggle locale={locale} className="!h-11 !w-11 !rounded border border-rule" />
              </li>
              <li>
                <Link
                  href={toggleHref}
                  onClick={() => setOpen(false)}
                  lang={en ? 'ne' : 'en'}
                  aria-label={dict.localeToggleAria}
                  className={`${SHEET_LINK} font-extrabold text-brand-strong`}
                >
                  {en ? 'नेपालीमा पढ्नुहोस्' : 'Read in English'}
                </Link>
              </li>
            </DrawerSection>

            <DrawerSection label={en ? 'More coverage' : 'थप सामग्री'} lang={lang}>
              {STATIC_HUBS.filter((hub) =>
                ['most-read', 'exclusive', 'rashifal', 'sports-live', 'video', 'photos'].includes(
                  hub.key,
                ),
              ).map((hub) => (
                <li key={hub.key}>
                  <Link
                    href={localizeHref(locale, hub.path)}
                    onClick={() => setOpen(false)}
                    className={SHEET_LINK}
                  >
                    {en ? hub.titleEn : hub.titleNe}
                  </Link>
                </li>
              ))}
            </DrawerSection>

            <DrawerSection label={en ? 'About Nagarik Watch' : 'नागरिक वाचबारे'} lang={lang}>
              {(
                [
                  ['/about', en ? 'About' : 'हाम्रोबारे'],
                  ['/editorial-policy', en ? 'Editorial policy' : 'सम्पादकीय नीति'],
                  ['/corrections-policy', en ? 'Corrections' : 'सच्याइ नीति'],
                  ['/contact', en ? 'Contact' : 'सम्पर्क'],
                  ['/privacy', en ? 'Privacy' : 'गोपनीयता'],
                ] as const
              ).map(([path, label]) => (
                <li key={path}>
                  <Link
                    href={localizeHref(locale, path)}
                    onClick={() => setOpen(false)}
                    className={SHEET_LINK}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </DrawerSection>
          </div>
        </div>
      </OverlayDialog>
    </>
  )
}

function DrawerSection({
  label,
  lang,
  children,
}: {
  label: string
  lang: 'en' | 'ne'
  children: ReactNode
}) {
  return (
    <section className="mb-4 last:mb-0">
      <h2
        className={
          lang === 'en'
            ? 'px-2 pb-1 pt-2 text-caption font-extrabold uppercase tracking-[0.05em] text-mute'
            : 'px-2 pb-1 pt-2 font-display text-meta font-extrabold text-mute'
        }
        lang={lang}
      >
        {label}
      </h2>
      <ul>{children}</ul>
    </section>
  )
}

function UtilityLink({
  href,
  onClick,
  icon,
  label,
}: {
  href: string
  onClick: () => void
  icon: ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-12 items-center gap-2.5 rounded border border-rule bg-surface px-3 py-2 text-meta font-extrabold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-brand-strong">
        {icon}
      </span>
      <span className="min-w-0 leading-snug">{label}</span>
    </Link>
  )
}
