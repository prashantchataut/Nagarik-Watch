import { describe, expect, it } from 'vitest'
import {
  createJournalistDraftRevision,
  hashJournalistDraftSnapshot,
  normalizeJournalistDraftSnapshot,
} from './journalist-revisions'

const snapshot = {
  titleNe: '  परीक्षण शीर्षक  ',
  slug: 'test-story',
  categorySlug: 'news',
  bodyNe: 'पहिलो अनुच्छेद\r\n\r\nदोस्रो अनुच्छेद',
  tagSlugs: ['Politics', 'news', 'politics'],
  notificationMode: 'followers' as const,
  notificationTags: ['news'],
}

describe('journalist draft revisions', () => {
  it('keeps the title and body needed to reconstruct a revision', () => {
    const revision = createJournalistDraftRevision({
      id: 'revision-1',
      createdAt: '2026-07-18T10:00:00.000Z',
      articleId: 'article-1',
      articleSlug: 'test-story',
      reporterId: 'reporter-1',
      actorId: 'reporter-1',
      actorRole: 'journalist',
      action: 'saved',
      stage: 'draft',
      snapshot,
    })

    expect(revision.snapshot.titleNe).toBe('परीक्षण शीर्षक')
    expect(revision.snapshot.bodyNe).toBe('पहिलो अनुच्छेद\n\nदोस्रो अनुच्छेद')
    expect(revision.snapshot.tagSlugs).toEqual(['news', 'politics'])
    expect(revision.contentHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('produces a deterministic hash for normalized content', () => {
    const first = normalizeJournalistDraftSnapshot(snapshot)
    const second = normalizeJournalistDraftSnapshot({
      ...snapshot,
      titleNe: 'परीक्षण शीर्षक',
      tagSlugs: ['news', 'politics'],
    })

    expect(hashJournalistDraftSnapshot(first)).toBe(hashJournalistDraftSnapshot(second))
  })

  it('changes the hash when reconstructable content changes', () => {
    const first = normalizeJournalistDraftSnapshot(snapshot)
    const second = normalizeJournalistDraftSnapshot({ ...snapshot, bodyNe: 'फरक सामग्री' })

    expect(hashJournalistDraftSnapshot(first)).not.toBe(hashJournalistDraftSnapshot(second))
  })
})
