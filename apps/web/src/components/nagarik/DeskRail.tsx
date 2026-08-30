'use client'

import { desks } from '@/lib/news/data'
import { href, type Route } from '@/lib/news/router'

const RAIL_DESKS = [
  'politics',
  'society',
  'business',
  'sports',
  'entertainment',
  'world',
  'opinion',
  'literature',
  'technology',
  'health',
  'education',
]

const deskName = (slug: string) => desks.find((d) => d.slug === slug)?.nameNe ?? slug

export default function DeskRail({ route }: { route: Route }) {
  const activeDesk =
    route.name === 'desk' || route.name === 'article' ? route.desk : null

  return (
    <nav
      aria-label="डेस्क"
      className="crimson-band sticky top-0 z-40 shadow-[0_2px_10px_rgba(102,15,18,0.28)] no-print"
    >
      <div className="mx-auto flex max-w-[1180px] items-stretch">
        {/* Mobile swipe rail */}
        <div className="no-scrollbar flex flex-1 items-stretch overflow-x-auto md:mx-0 md:px-0">
          <a
            href={href('/')}
            data-active={route.name === 'home' || route.name === 'english'}
            className="rail-link flex items-center px-3.5 py-2.5 text-[15px] text-white/85 transition-colors hover:text-white data-[active=true]:text-white md:px-4 md:py-3"
          >
            गृह
          </a>
          {RAIL_DESKS.map((slug) => (
            <a
              key={slug}
              href={href(`/${slug}`)}
              data-active={activeDesk === slug}
              className="rail-link flex items-center px-3.5 py-2.5 text-[15px] text-white/85 transition-colors hover:text-white data-[active=true]:text-white md:px-4 md:py-3"
            >
              {deskName(slug)}
            </a>
          ))}
          <a
            href={href('/province')}
            data-active={route.name === 'province'}
            className="rail-link flex items-center px-3.5 py-2.5 text-[15px] text-white/85 transition-colors hover:text-white data-[active=true]:text-white md:px-4 md:py-3"
          >
            प्रदेश
          </a>
        </div>
        {/* Desktop right-side utilities */}
        <div className="hidden items-center gap-1 pr-1 md:flex">
          <a
            href={href('/nepse')}
            className="rounded-sm px-3 py-1.5 font-headline text-[14px] font-semibold text-white/90 transition-colors hover:bg-black/15 hover:text-white"
          >
            नेप्से
          </a>
          <a
            href={href('/scores')}
            className="rounded-sm px-3 py-1.5 font-headline text-[14px] font-semibold text-white/90 transition-colors hover:bg-black/15 hover:text-white"
          >
            लाइभ स्कोर
          </a>
          <a
            href={href('/rashifal')}
            className="rounded-sm px-3 py-1.5 font-headline text-[14px] font-semibold text-white/90 transition-colors hover:bg-black/15 hover:text-white"
          >
            राशिफल
          </a>
          <a
            href={href('/en')}
            className="ml-1 rounded-sm border border-white/45 px-2.5 py-1 font-headline text-[13px] font-bold uppercasest text-white transition-colors hover:bg-white hover:text-crimson-deep"
          >
            EN
          </a>
        </div>
      </div>
    </nav>
  )
}
