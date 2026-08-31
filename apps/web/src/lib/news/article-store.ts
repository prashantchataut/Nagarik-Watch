'use client'

import { useEffect, useSyncExternalStore } from 'react'
import type { Story } from '@/lib/news/data'
import type { PublicArticle } from '@/lib/news/cms'
import { apiGet } from './api-client'

/**
 * Client store for CMS articles published from the newsroom desk.
 * Fetched once per mount cycle (+ 2-minute background refresh), shared by
 * every surface that merges live journalism into the static edition.
 */

let cache: PublicArticle[] | null = null
let fetching = false
let fetchedAt = 0
const listeners = new Set<() => void>()

const REFRESH_MS = 2 * 60 * 1000

function emit() {
  for (const l of listeners) l()
}

export async function refreshArticles(force = false): Promise<void> {
  if (fetching) return
  if (!force && cache && Date.now() - fetchedAt < REFRESH_MS) return
  fetching = true
  try {
    const json = await apiGet<{ articles: PublicArticle[] }>('/api/articles?limit=200')
    cache = json.articles
    fetchedAt = Date.now()
    emit()
  } catch {
    /* keep whatever we had; the edition still renders from the archive.
       On a cold failure, resolve to an empty list so loading states finish. */
    if (cache === null) {
      cache = []
      emit()
    }
  } finally {
    fetching = false
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  void refreshArticles()
  return () => {
    listeners.delete(cb)
  }
}

const serverSnapshot: PublicArticle[] = []

export function useDbArticles(): { dbArticles: PublicArticle[]; ready: boolean } {
  const snap = useSyncExternalStore(
    subscribe,
    () => cache,
    () => serverSnapshot,
  )
  useEffect(() => {
    void refreshArticles()
  }, [])
  return { dbArticles: snap ?? [], ready: snap != null }
}

/** Convert a public CMS article to the common Story shape. */
export function dbArticleToStory(a: PublicArticle): Story {
  return {
    slug: a.slug,
    desk: a.desk,
    titleNe: a.titleNe,
    titleEn: a.titleEn,
    deckNe: a.deckNe,
    deckEn: a.deckEn,
    bodyNe: a.bodyNe,
    bodyEn: a.bodyEn,
    publishedAt: a.publishedAt,
    readingMinutes: a.readingMinutes,
    featured: 'none',
    location: a.location,
    province: a.province,
    hero: a.hero,
    heroCaption: a.heroCaption,
    heroCredit: a.heroCredit,
    tags: a.tags,
    author: a.author,
  }
}

/** Look up a live CMS article by desk + slug from the store (sync). */
export function findDbArticle(desk: string, slug: string): PublicArticle | undefined {
  return cache?.find((a) => a.desk === desk && a.slug === slug)
}
