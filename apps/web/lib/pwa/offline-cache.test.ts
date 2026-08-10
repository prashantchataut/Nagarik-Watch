import { describe, expect, it } from 'vitest'
import {
  ARTICLE_CACHE_LIMIT,
  IMAGE_CACHE_LIMIT,
  NON_ARTICLE_FIRST_SEGMENTS,
  NON_ARTICLE_TWO_SEGMENT_PATHS,
  buildOfflineWorkerHelpersSource,
  isCacheControlAllowed,
  isOfflineCacheableResponse,
  isOfflineExcludedPath,
  isPublicArticleNavigationPath,
  isPublicArticlePath,
  isSameOriginUrl,
  selectKeysToDelete,
  stripPublicLocalePrefix,
} from './offline-cache'

describe('stripPublicLocalePrefix', () => {
  it('keeps Nepali root paths unchanged', () => {
    expect(stripPublicLocalePrefix('/politics/budget')).toBe('/politics/budget')
    expect(stripPublicLocalePrefix('/')).toBe('/')
  })

  it('strips the English locale prefix', () => {
    expect(stripPublicLocalePrefix('/en')).toBe('/')
    expect(stripPublicLocalePrefix('/en/politics/budget')).toBe('/politics/budget')
  })
})

describe('isOfflineExcludedPath', () => {
  it('blocks API, newsroom, auth, and account desks', () => {
    for (const path of [
      '/api/bookmarks',
      '/admin',
      '/admin/launch',
      '/journalist/dashboard',
      '/auth/login',
      '/en/auth/signup',
      '/saved',
      '/en/saved',
      '/profile',
      '/en/profile',
      '/reader-corner',
      '/en/reader-corner',
    ]) {
      expect(isOfflineExcludedPath(path), path).toBe(true)
    }
  })

  it('allows public article and shell paths', () => {
    for (const path of ['/', '/politics/budget', '/en/society/housing', '/icon.svg']) {
      expect(isOfflineExcludedPath(path), path).toBe(false)
    }
  })
})

describe('isPublicArticlePath', () => {
  it('recognizes localized article navigations', () => {
    expect(isPublicArticleNavigationPath('/politics/budget-speech')).toBe(true)
    expect(isPublicArticleNavigationPath('/en/sports/nepal-vs-india')).toBe(true)
    expect(
      isPublicArticlePath(
        '/politics/budget-speech',
        NON_ARTICLE_FIRST_SEGMENTS,
        NON_ARTICLE_TWO_SEGMENT_PATHS,
      ),
    ).toBe(true)
  })

  it('rejects hubs, taxonomy pages, and excluded desks', () => {
    for (const path of [
      '/',
      '/latest',
      '/sports/live',
      '/author/jane',
      '/tag/election',
      '/topic/floods',
      '/province/bagmati',
      '/utilities/calendar',
      '/patro',
      '/auth/login',
      '/saved',
      '/politics',
      '/politics/budget/extra',
    ]) {
      expect(isPublicArticleNavigationPath(path), path).toBe(false)
    }
  })
})

describe('isCacheControlAllowed', () => {
  it('allows missing or public cache directives', () => {
    expect(isCacheControlAllowed(null)).toBe(true)
    expect(isCacheControlAllowed(undefined)).toBe(true)
    expect(isCacheControlAllowed('')).toBe(true)
    expect(
      isCacheControlAllowed('public, max-age=0, s-maxage=300, stale-while-revalidate=86400'),
    ).toBe(true)
    expect(isCacheControlAllowed('max-age=60, no-cache')).toBe(true)
  })

  it('rejects private and no-store', () => {
    expect(isCacheControlAllowed('private, max-age=0')).toBe(false)
    expect(isCacheControlAllowed('no-store')).toBe(false)
    expect(isCacheControlAllowed('public, no-store, max-age=0')).toBe(false)
    expect(isCacheControlAllowed('PRIVATE')).toBe(false)
  })
})

describe('isOfflineCacheableResponse', () => {
  it('requires ok same-origin responses without private/no-store', () => {
    expect(
      isOfflineCacheableResponse({
        ok: true,
        status: 200,
        type: 'basic',
        cacheControl: 'public, max-age=0',
      }),
    ).toBe(true)

    expect(
      isOfflineCacheableResponse({
        ok: false,
        status: 404,
        type: 'basic',
        cacheControl: 'public',
      }),
    ).toBe(false)

    expect(
      isOfflineCacheableResponse({
        ok: true,
        status: 0,
        type: 'opaque',
        cacheControl: null,
      }),
    ).toBe(false)

    expect(
      isOfflineCacheableResponse({
        ok: true,
        status: 200,
        type: 'basic',
        cacheControl: 'private',
      }),
    ).toBe(false)
  })
})

describe('selectKeysToDelete', () => {
  it('evicts oldest keys first to honor hard caps', () => {
    expect(ARTICLE_CACHE_LIMIT).toBe(30)
    expect(IMAGE_CACHE_LIMIT).toBe(80)

    const keys = Array.from({ length: 32 }, (_, i) => `article-${i}`)
    expect(selectKeysToDelete(keys, 30)).toEqual(['article-0', 'article-1'])
    expect(selectKeysToDelete(keys.slice(0, 30), 30)).toEqual([])
    expect(selectKeysToDelete(['a', 'b'], 0)).toEqual(['a', 'b'])
  })
})

describe('isSameOriginUrl', () => {
  it('compares origins safely', () => {
    expect(isSameOriginUrl('https://news.example/politics/x', 'https://news.example')).toBe(true)
    expect(isSameOriginUrl('https://cdn.example/img.png', 'https://news.example')).toBe(false)
    expect(isSameOriginUrl('not a url', 'https://news.example')).toBe(false)
  })
})

describe('buildOfflineWorkerHelpersSource', () => {
  it('embeds helpers that match the TypeScript eligibility rules', () => {
    const scope: Record<string, unknown> = {}
    // eslint-disable-next-line no-new-func -- evaluate the exact SW helper source under test
    const install = new Function(`${buildOfflineWorkerHelpersSource()}; return {
      isOfflineExcludedPath,
      isPublicArticleNavigationPath,
      isCacheControlAllowed,
      isOfflineCacheableResponse,
      selectKeysToDelete,
    }`)
    Object.assign(scope, install())

    const excluded = scope.isOfflineExcludedPath as typeof isOfflineExcludedPath
    const article = scope.isPublicArticleNavigationPath as typeof isPublicArticleNavigationPath
    const cacheControl = scope.isCacheControlAllowed as typeof isCacheControlAllowed
    const cacheable = scope.isOfflineCacheableResponse as typeof isOfflineCacheableResponse
    const evict = scope.selectKeysToDelete as typeof selectKeysToDelete

    expect(excluded('/admin/launch')).toBe(true)
    expect(excluded('/en/saved')).toBe(true)
    expect(article('/politics/budget')).toBe(true)
    expect(article('/sports/live')).toBe(false)
    expect(cacheControl('private, max-age=0')).toBe(false)
    expect(cacheable({ ok: true, status: 200, type: 'opaque', cacheControl: null })).toBe(false)
    expect(evict(['a', 'b', 'c'], 2)).toEqual(['a'])
  })
})
