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

  it('defaults to the desk store when nothing is declared and no CMS origin exists', async () => {
    delete process.env.CONTENT_SOURCE
    delete process.env.PAYLOAD_CONTENT_SOURCE
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL
    delete process.env.NEXT_PHASE

    const { declaredContentSource, isPayloadCanonical, isPayloadSourceMisconfigured } =
      await import('./payload-admin-client')
    const { resolveContentSource } = await import('./resolve-content-source')

    // Dev/CI/build must be able to run without a Payload deployment. This is the
    // documented escape hatch that keeps `pnpm build` working on a fresh clone.
    expect(declaredContentSource()).toBe('json')
    expect(isPayloadCanonical()).toBe(false)
    expect(isPayloadSourceMisconfigured()).toBe(false)
    await expect(resolveContentSource()).resolves.toBeDefined()
  })

  it('still fail-closes on a production runtime with no CMS origin', async () => {
    delete process.env.CONTENT_SOURCE
    delete process.env.PAYLOAD_CONTENT_SOURCE
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL
    delete process.env.NEXT_PHASE
    process.env = { ...process.env, NODE_ENV: 'production' }

    const { declaredContentSource, isPayloadCanonical, isPayloadSourceMisconfigured } =
      await import('./payload-admin-client')
    const { resolveContentSource } = await import('./resolve-content-source')

    expect(declaredContentSource()).toBe('payload')
    expect(isPayloadCanonical()).toBe(false)
    expect(isPayloadSourceMisconfigured()).toBe(true)
    await expect(resolveContentSource()).rejects.toThrow(/PAYLOAD_PUBLIC_SERVER_URL/)
  })

  it('resolves to Payload when only the CMS origin is configured', async () => {
    delete process.env.CONTENT_SOURCE
    delete process.env.PAYLOAD_CONTENT_SOURCE
    delete process.env.NEXT_PHASE
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://cms.example.test'

    const { declaredContentSource, isPayloadCanonical } = await import('./payload-admin-client')
    expect(declaredContentSource()).toBe('payload')
    expect(isPayloadCanonical()).toBe(true)
  })

  it('fail-closes when CONTENT_SOURCE=payload but CMS URL is missing', async () => {
    process.env.CONTENT_SOURCE = 'payload'
    delete process.env.PAYLOAD_PUBLIC_SERVER_URL
    delete process.env.PAYLOAD_ADMIN_URL

    const { isPayloadSourceMisconfigured } = await import('./payload-admin-client')
    const { resolveContentSource } = await import('./resolve-content-source')

    expect(isPayloadSourceMisconfigured()).toBe(true)
    await expect(resolveContentSource()).rejects.toThrow(/PAYLOAD_PUBLIC_SERVER_URL/)
  }, 15_000)

  it('fail-closes a declared live launch that still points at the shadow store', async () => {
    process.env.NEXT_PUBLIC_LAUNCH_STATUS = 'live'
    process.env.CONTENT_SOURCE = 'json'
    process.env.PAYLOAD_PUBLIC_SERVER_URL = 'https://cms.example.test'

    const { isPayloadSourceMisconfigured, shouldBlockLocalContentWrites } =
      await import('./payload-admin-client')
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
