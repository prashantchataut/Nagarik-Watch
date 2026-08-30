import { desks, stories, type Story } from './data'
import { toDevanagari } from './patro'

export function storyUrl(story: Story): string {
  return `#/${story.desk}/${story.slug}`
}

export function byDesk(deskSlug: string): Story[] {
  return stories.filter((s) => s.desk === deskSlug).sort(byDateDesc)
}

export function byProvince(provinceSlug: string): Story[] {
  return stories.filter((s) => s.province === provinceSlug).sort(byDateDesc)
}

export function byDateDesc(a: Story, b: Story): number {
  return b.publishedAt.localeCompare(a.publishedAt)
}

export function latest(count: number, excludeSlugs: string[] = []): Story[] {
  return stories
    .filter((s) => !excludeSlugs.includes(s.slug))
    .sort(byDateDesc)
    .slice(0, count)
}

export function leadStory(): Story {
  const leads = stories.filter((s) => s.featured === 'lead').sort(byDateDesc)
  return leads[0] ?? stories[0]!
}

export function supportPair(excludeSlug: string): Story[] {
  const secondary = stories
    .filter((s) => s.featured === 'secondary' && s.slug !== excludeSlug)
    .sort(byDateDesc)
  return secondary.slice(0, 2)
}

export function findStory(desk: string, slug: string): Story | undefined {
  return stories.find((s) => s.desk === desk && s.slug === slug)
}

export function relatedStories(story: Story, count = 4): Story[] {
  const sameDesk = stories.filter((s) => s.desk === story.desk && s.slug !== story.slug)
  const sameProvince = stories.filter(
    (s) => s.province === story.province && s.desk !== story.desk && s.slug !== story.slug,
  )
  const merged = [...sameDesk.sort(byDateDesc), ...sameProvince.sort(byDateDesc)]
  return merged.slice(0, count)
}

export function searchStories(query: string): Story[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return stories
    .filter((s) => {
      const hay = [
        s.titleNe, s.titleEn, s.deckNe, s.deckEn, s.author, s.location,
        ...s.tags,
      ].join(' ').toLowerCase()
      return hay.includes(q)
    })
    .sort(byDateDesc)
}

/** Relative Nepali time label, e.g. "५ मिनेट अघि" (timestamps are demo-dated). */
export function timeAgoNe(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const mins = Math.max(1, Math.round((now - then) / 60000))
  if (mins < 60) return `${toDevanagari(mins)} मिनेट अघि`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${toDevanagari(hours)} घण्टा अघि`
  const days = Math.round(hours / 24)
  return `${toDevanagari(days)} दिन अघि`
}

export function deskName(deskSlug: string): string {
  return desks.find((d) => d.slug === deskSlug)?.nameNe ?? deskSlug
}

/** Desk role drives homepage presentation (per DESIGN.md §desks). */
export type DeskRole = 'news' | 'market' | 'photo' | 'voices' | 'feature'
const DESK_ROLES: Record<string, DeskRole> = {
  politics: 'news',
  society: 'news',
  business: 'market',
  sports: 'photo',
  entertainment: 'photo',
  opinion: 'voices',
  literature: 'voices',
  world: 'news',
  technology: 'feature',
  health: 'feature',
  education: 'feature',
  interview: 'voices',
  'photo-story': 'photo',
  video: 'photo',
  diaspora: 'feature',
}

export function deskRole(deskSlug: string): DeskRole {
  return DESK_ROLES[deskSlug] ?? 'feature'
}

export function formatNumberNe(n: number, digits = 2): string {
  return toDevanagari(n.toFixed(digits))
}
