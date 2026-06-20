import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  _resetAdaptersForTest,
  getEdge,
  getStorage,
  noopEdgeAdapter,
  noopStorageAdapter,
} from './index'

const originalEdgeProvider = process.env.EDGE_PROVIDER
const originalStorageEndpoint = process.env.STORAGE_ENDPOINT
const originalStorageKey = process.env.STORAGE_ACCESS_KEY_ID

beforeEach(() => {
  _resetAdaptersForTest()
})

afterEach(() => {
  // Restore env between tests.
  if (originalEdgeProvider === undefined) delete process.env.EDGE_PROVIDER
  else process.env.EDGE_PROVIDER = originalEdgeProvider
  if (originalStorageEndpoint === undefined) delete process.env.STORAGE_ENDPOINT
  else process.env.STORAGE_ENDPOINT = originalStorageEndpoint
  if (originalStorageKey === undefined) delete process.env.STORAGE_ACCESS_KEY_ID
  else process.env.STORAGE_ACCESS_KEY_ID = originalStorageKey
})

describe('edge adapter selection', () => {
  it('returns the no-op adapter when EDGE_PROVIDER is unset', () => {
    delete process.env.EDGE_PROVIDER
    expect(getEdge().provider).toBe('none')
    expect(getEdge()).toBe(noopEdgeAdapter)
  })

  it('returns cloudflare when EDGE_PROVIDER=cloudflare', () => {
    process.env.EDGE_PROVIDER = 'cloudflare'
    expect(getEdge().provider).toBe('cloudflare')
  })
})

describe('storage adapter selection', () => {
  it('returns no-op storage when STORAGE_* is unset', () => {
    delete process.env.STORAGE_ENDPOINT
    delete process.env.STORAGE_ACCESS_KEY_ID
    expect(getStorage().provider).toBe('none')
    expect(getStorage()).toBe(noopStorageAdapter)
  })
})

describe('noop adapters are safe', () => {
  it('noop storage round-trips a key to a memory URL', async () => {
    const stored = await noopStorageAdapter.put({
      key: 'test.webp',
      body: new Uint8Array(),
      contentType: 'image/webp',
    })
    expect(stored.url).toBe('memory://test.webp')
    expect(noopStorageAdapter.getUrl('test.webp')).toBe('memory://test.webp')
    await expect(noopStorageAdapter.delete('test.webp')).resolves.toBeUndefined()
  })

  it('noop edge purge resolves without error', async () => {
    await expect(noopEdgeAdapter.purge({ urls: ['/'], tags: ['home'] })).resolves.toBeUndefined()
  })
})
