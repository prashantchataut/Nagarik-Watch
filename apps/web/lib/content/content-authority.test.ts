import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

describe('content authority / emergency fallback', () => {
  const original = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...original }
    vi.restoreAllMocks()
  })

  it('treats CONTENT_SOURCE=json as the writable emergency desk', async () => {
    process.env.CONTENT_SOURCE = 'json'
    delete process.env.PAYLOAD_CONTENT_SOURCE
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'preview'
    const { isPayloadCanonical, shouldBlockLocalContentWrites, isPayloadSourceMisconfigured } =
      await import('@/lib/content/payload-admin-client')
    expect(isPayloadCanonical()).toBe(false)
    expect(shouldBlockLocalContentWrites()).toBe(false)
    expect(isPayloadSourceMisconfigured()).toBe(false)
  })

  it('blocks local desk writes when Payload is canonical', async () => {
    process.env.CONTENT_SOURCE = 'payload'
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://admin.example.com'
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'preview'
    const { isPayloadCanonical, shouldBlockLocalContentWrites } = await import(
      '@/lib/content/payload-admin-client'
    )
    expect(isPayloadCanonical()).toBe(true)
    expect(shouldBlockLocalContentWrites()).toBe(true)
  })

  it('fail-closes live launch without Payload URL', async () => {
    process.env.CONTENT_SOURCE = 'payload'
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'live'
    const { isPayloadSourceMisconfigured, shouldBlockLocalContentWrites } = await import(
      '@/lib/content/payload-admin-client'
    )
    expect(isPayloadSourceMisconfigured()).toBe(true)
    expect(shouldBlockLocalContentWrites()).toBe(true)
  })
})
