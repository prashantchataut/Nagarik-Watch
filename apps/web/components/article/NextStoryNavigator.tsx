'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type NextStoryNavigatorProps = {
  nextStory?: StoryCardData | null
  prevStory?: StoryCardData | null
  locale: Locale
}

export function NextStoryNavigator({ nextStory, prevStory, locale }: NextStoryNavigatorProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const isEn = locale === 'en'
  const lang = isEn ? 'en' : 'ne'

  useEffect(() => {
    function onScroll() {
      if (dismissed) return
      // Reveal when scrolled past 40% of the page
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (total > 0 && scrolled / total > 0.35) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [dismissed])

  if (!nextStory && !prevStory) return null

  const storyToRead = nextStory || prevStory
  if (!storyToRead) return null

  const title = isEn && storyToRead.titleEn ? storyToRead.titleEn : storyToRead.titleNe
  const nextHref = localizeHref(locale, `/${storyToRead.category.slug}/${storyToRead.slug}`)
  const thumb =
    storyToRead.heroImage?.url && !storyToRead.heroImage.url.startsWith('data:')
      ? storyToRead.heroImage.url
      : null

  return (
    <>
      {/* 1. Inline Prev / Next Navigation Strip at End of Article */}
      <nav
        aria-label={isEn ? 'Article navigation' : 'समाचार नेभिगेसन'}
        className="my-8 grid gap-4 border-y border-rule py-4 sm:grid-cols-2 print:hidden"
        lang={lang}
      >
        {prevStory ? (
          <Link
            href={localizeHref(locale, `/${prevStory.category.slug}/${prevStory.slug}`)}
            className="group flex flex-col gap-1 rounded-md border border-rule/70 bg-surface-raised/40 p-3 transition-all hover:border-brand hover:bg-brand-tint/30"
          >
            <span className="text-[0.72rem] font-bold text-mute uppercase tracking-wider">
              {isEn ? '← Previous Story' : '← अघिल्लो समाचार'}
            </span>
            <span className="font-display text-body font-bold text-ink line-clamp-2 group-hover:text-brand-strong">
              {isEn && prevStory.titleEn ? prevStory.titleEn : prevStory.titleNe}
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        {nextStory ? (
          <Link
            href={nextHref}
            className="group flex flex-col items-end text-right gap-1 rounded-md border border-rule/70 bg-surface-raised/40 p-3 transition-all hover:border-brand hover:bg-brand-tint/30"
          >
            <span className="text-[0.72rem] font-bold text-brand-strong uppercase tracking-wider">
              {isEn ? 'Next Story →' : 'अर्को समाचार →'}
            </span>
            <span className="font-display text-body font-bold text-ink line-clamp-2 group-hover:text-brand-strong">
              {title}
            </span>
          </Link>
        ) : null}
      </nav>

      {/* 2. Floating Continuous Reading Dock (appears on scroll) */}
      {visible && !dismissed ? (
        <aside
          className="fixed bottom-[4rem] lg:bottom-5 right-3 left-3 sm:left-auto sm:right-5 sm:max-w-md z-40 animate-fade-in print:hidden"
          role="complementary"
          aria-label={isEn ? 'Next story recommendation' : 'अर्को समाचार सिफारिस'}
        >
          <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-surface/98 p-3 shadow-2xl backdrop-blur-md">
            {thumb ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />
              </div>
            ) : null}

            <div className="min-w-0 flex-1">
              <span className="text-[0.68rem] font-black uppercase tracking-wider text-brand-strong">
                {isEn ? 'Next up • Read next' : 'अर्को समाचार'}
              </span>
              <p className="font-display text-caption sm:text-body font-bold text-ink line-clamp-2 leading-snug">
                <Link href={nextHref} className="hover:text-brand-strong transition-colors">
                  {title}
                </Link>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Link
                href={nextHref}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-brand px-3 text-caption font-bold text-paper shadow-sm hover:bg-brand-strong transition-colors active:scale-95"
              >
                {isEn ? 'Read →' : 'पढ्नुहोस् →'}
              </Link>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-mute hover:bg-surface-raised hover:text-ink transition-colors"
                aria-label={isEn ? 'Close' : 'बन्द गर्नुहोस्'}
              >
                ✕
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  )
}
