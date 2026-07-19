import { promises as fs } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'interactions.json')

async function resetLocalFile() {
  await fs.rm(LOCAL_FILE, { force: true })
}

describe('interaction-matrix (local file fallback)', () => {
  beforeEach(async () => {
    delete process.env.DATABASE_URL
    await resetLocalFile()
    // Module keeps an in-memory cache of the local file, so it must be reset
    // alongside the file itself for tests to observe a clean slate.
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
    const { matrixReaderCount, recordInteraction, getInteractionMatrix } = await import(
      './interaction-matrix'
    )
    await recordInteraction('reader-f', 'story-1')
    await recordInteraction('reader-g', 'story-1')

    const matrix = await getInteractionMatrix()
    expect(matrixReaderCount(matrix)).toBe(2)
  })
})
