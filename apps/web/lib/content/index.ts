import 'server-only'
import type {
  Article,
  Author,
  Category,
  HomepageData,
  Locale,
  PaginatedStories,
  Tag,
} from '@nagarikwatch/db'
import type { ContentSource, StoryListOptions } from './source'
import { contentSourceFingerprint, resolveContentSource } from './resolve-content-source'
import { isPayloadCanonical, isPayloadDeclared } from './payload-admin-client'
import { readHomepageSnapshot, writeHomepageSnapshot } from './public-snapshot'
import { processState } from '@/lib/runtime/process-singleton'

/**
 * Module scope is not process scope. Next emits this file into both the RSC/SSR
 * graph and the route-handler graph, so a plain `let` here exists once per
 * layer. For a promise guard that means the "run this once" work runs twice --
 * which is how a `CREATE TABLE IF NOT EXISTS` and the `SELECT` two lines later
 * ended up on different database handles -- and for a cache it means two
 * answers to the same question in one process. `processState` keys off
 * `globalThis`, the only scope both layers share.
 * See lib/runtime/process-singleton.ts.
 */
const local = processState('content-source:local', () => ({
  cached: null as { key: string; source: Promise<ContentSource> } | null,
}))

async function source(): Promise<ContentSource> {
  const key = contentSourceFingerprint()
  if (!local.cached || local.cached.key !== key) {
    local.cached = {
      key,
      source: resolveContentSource().catch((error) => {
        if (local.cached?.key === key) local.cached = null
        throw error
      }),
    }
  }
  return local.cached.source
}

export async function getArticleBySlug(
  category: string,
  slug: string,
  locale: Locale,
): Promise<Article | null> {
  return (await source()).getArticleBySlug(category, slug, locale)
}

export async function getHomepage(): Promise<HomepageData | null> {
  try {
    const content = await source()
    const homepage = await content.getHomepage()
    if (homepage && isPayloadCanonical()) {
      await writeHomepageSnapshot(homepage).catch(() => false)
    }
    return homepage
  } catch (error) {
    // A deployment may temporarily lose the Payload URL/config as well as Payload itself.
    // A live launch is Payload-authoritative by policy even if CONTENT_SOURCE drifts, so a
    // recent reader-safe Payload snapshot is the only acceptable fallback. Never substitute
    // development JSON/seed content here; the launch gate still reports the env drift.
    const liveLaunch =
      (process.env.NEXT_PUBLIC_LAUNCH_STATUS?.trim() || 'preview').toLowerCase() === 'live'
    if (isPayloadDeclared() || liveLaunch) {
      const snapshot = await readHomepageSnapshot()
      if (snapshot) {
        console.warn(
          '[content] canonical Payload homepage unavailable; serving recent published snapshot',
          error instanceof Error ? error.message : error,
        )
        return snapshot
      }
    }
    throw error
  }
}

export async function refreshCanonicalHomepageSnapshot(): Promise<boolean> {
  if (!isPayloadCanonical()) return false
  const homepage = await (await source()).getHomepage()
  if (!homepage) return false
  return writeHomepageSnapshot(homepage, { force: true })
}

export async function getCategoryPage(
  slug: string,
  page: number,
  locale: Locale,
): Promise<PaginatedStories | null> {
  return (await source()).getCategoryPage(slug, page, locale)
}

export async function getCategory(slug: string): Promise<Category | null> {
  return (await source()).getCategory(slug)
}

export async function getNavCategories(): Promise<Category[]> {
  return (await source()).getNavCategories()
}

export async function getAuthors(): Promise<Author[]> {
  return (await source()).getAuthors()
}

export async function getTags(): Promise<Tag[]> {
  return (await source()).getTags()
}

export async function getStories(opts: StoryListOptions): Promise<PaginatedStories> {
  return (await source()).getStories(opts)
}

export async function getAuthor(
  slug: string,
  locale: Locale,
): Promise<{ author: Author; stories: PaginatedStories } | null> {
  return (await source()).getAuthor(slug, locale)
}

export async function getTag(
  slug: string,
  locale: Locale,
): Promise<{ tag: Tag; stories: PaginatedStories } | null> {
  return (await source()).getTag(slug, locale)
}

export type { ContentSource, StoryListOptions }
