import { promises as fs } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearProcessSingleton } from '@/lib/runtime/process-singleton'

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'interactions.json')

async function resetLocalFile() {
  await fs.rm(LOCAL_FILE, { force: true })
}

describe('interaction-matrix (local file fallback)', () => {
  beforeEach(async () => {
    delete process.env.DATABASE_URL
    await resetLocalFile()
    // The local cache is process-scoped on purpose (see process-singleton.ts),
    // so `vi.resetModules()` alone no longer clears it -- surviving a module
    // re-evaluation is the whole point of the change. Clearing the registry
    // entry only helps if the module is then re-evaluated, because the module
    // holds the object processState() handed it; hence both calls.
    clearProcessSingleton('engagement-interaction-matrix:local')
    vi.resetModules()
  })

  afterEach(async () => {
    await resetLocalFile()
  })

  it('starts empty when no local file exists', async () => {
    const { getInteractionMatrix } = await import('./interaction-matrix')
    expect(await getInteractionMatrix()).toEqual({})
  })

  it('records interactions per owner/article and defaults weight to 1', async () => {
    const { getInteractionMatrix, recordInteraction } = await import('./interaction-matrix')
    await recordInteraction('reader-a', 'story-1')
    await recordInteraction('reader-a', 'story-2', 2)

    const matrix = await getInteractionMatrix()
    expect(matrix['reader-a']).toEqual({ 'story-1': 1, 'story-2': 2 })
  })

  it('keeps the maximum weight on repeated interactions instead of overwriting downward', async () => {
    const { getInteractionMatrix, recordInteraction } = await import('./interaction-matrix')
    await recordInteraction('reader-b', 'story-1', 2)
    await recordInteraction('reader-b', 'story-1', 0.5)

    const matrix = await getInteractionMatrix()
    expect(matrix['reader-b']?.['story-1']).toBe(2)
  })

  it('clamps weight into the [0.1, 10] range', async () => {
    const { getInteractionMatrix, recordInteraction } = await import('./interaction-matrix')
    await recordInteraction('reader-c', 'story-1', 999)
    await recordInteraction('reader-d', 'story-1', -5)

    const matrix = await getInteractionMatrix()
    expect(matrix['reader-c']?.['story-1']).toBe(10)
    expect(matrix['reader-d']?.['story-1']).toBe(0.1)
  })

  it('ignores blank owner keys or article slugs', async () => {
    const { getInteractionMatrix, recordInteraction } = await import('./interaction-matrix')
    await recordInteraction('  ', 'story-1')
    await recordInteraction('reader-e', '   ')

    const matrix = await getInteractionMatrix()
    expect(matrix).toEqual({})
  })

  it('reports the number of distinct readers via matrixReaderCount', async () => {
    const { matrixReaderCount, recordInteraction, getInteractionMatrix } =
      await import('./interaction-matrix')
    await recordInteraction('reader-f', 'story-1')
    await recordInteraction('reader-g', 'story-1')

    const matrix = await getInteractionMatrix()
    expect(matrixReaderCount(matrix)).toBe(2)
  })
})
