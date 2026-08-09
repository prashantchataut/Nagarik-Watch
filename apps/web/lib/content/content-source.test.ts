import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('content source resolution', () => {
  const env = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...env }
  })

  afterEach(() => {
    process.env = env
  })

  it('uses Payload when CONTENT_SOURCE=payload and CMS URL is configured', async () => {
    process.env.CONTENT_SOURCE = 'payload'
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://cms.example.test'
    process.env.NEXT_PHASE = 'phase-production-build'

    const { isPayloadCanonical } = await import('./payload-admin-client')
    expect(isPayloadCanonical()).toBe(true)
  })

  it('falls back to store when Payload is not canonical', async () => {
    delete process.env.CONTENT_SOURCE
    delete process.env.PAYLOAD_CONTENT_SOURCE
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL

    const { isPayloadCanonical } = await import('./payload-admin-client')
    expect(isPayloadCanonical()).toBe(false)
  })

  it('fail-closes when CONTENT_SOURCE=payload but CMS URL is missing', async () => {
    process.env.CONTENT_SOURCE = 'payload'
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL

    const { isPayloadSourceMisconfigured } = await import('./payload-admin-client')
    const { resolveContentSource } = await import('./resolve-content-source')

    expect(isPayloadSourceMisconfigured()).toBe(true)
    await expect(resolveContentSource()).rejects.toThrow(/PAYLOAD_PUBLIC_SERVER_URL/)
  })

  it('fail-closes a declared live launch that still points at the shadow store', async () => {
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'live'
    process.env.CONTENT_SOURCE = 'json'
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://cms.example.test'

    const { isPayloadSourceMisconfigured, shouldBlockLocalContentWrites } = await import('./payload-admin-client')
    const { resolveContentSource } = await import('./resolve-content-source')

    expect(isPayloadSourceMisconfigured()).toBe(true)
    expect(shouldBlockLocalContentWrites()).toBe(true)
    await expect(resolveContentSource()).rejects.toThrow(/requires CONTENT_SOURCE=payload/)
  })

  it('fingerprints content source so warm caches invalidate on env flip', async () => {
    process.env.CONTENT_SOURCE = 'json'
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    const { contentSourceFingerprint } = await import('./resolve-content-source')
    const a = contentSourceFingerprint()

    process.env.CONTENT_SOURCE = 'payload'
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://cms.example.test'
    const b = contentSourceFingerprint()

    expect(a).not.toEqual(b)
  })
})
