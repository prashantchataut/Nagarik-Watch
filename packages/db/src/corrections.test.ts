import { describe, expect, it } from 'vitest'
import { normalizeCorrectionLedger } from './corrections'

const issued = {
  id: 'row-1',
  at: '2026-09-20T10:00:00.000Z',
  summary: 'The district name was corrected.',
  madeBy: 'editor-1',
}

describe('normalizeCorrectionLedger', () => {
  it('stamps a new correction with the authenticated actor and server time', () => {
    expect(
      normalizeCorrectionLedger({
        previous: [issued],
        proposed: [issued, { summary: '  The total was corrected. ', madeBy: 'spoofed' }],
        actorId: 'publisher-2',
        now: '2026-09-25T12:00:00.000Z',
      }),
    ).toEqual([
      issued,
      {
        summary: 'The total was corrected.',
        madeBy: 'publisher-2',
        at: '2026-09-25T12:00:00.000Z',
      },
    ])
  })

  it('rejects editing an issued correction', () => {
    expect(() =>
      normalizeCorrectionLedger({
        previous: [issued],
        proposed: [{ ...issued, summary: 'A quieter version.' }],
        actorId: 'publisher-2',
      }),
    ).toThrow('Published corrections are immutable')
  })

  it('rejects removing an issued correction', () => {
    expect(() =>
      normalizeCorrectionLedger({ previous: [issued], proposed: [], actorId: 'publisher-2' }),
    ).toThrow('Published corrections are append-only')
  })

  it('rejects blank and overlong correction notes', () => {
    expect(() =>
      normalizeCorrectionLedger({ previous: [], proposed: [{ summary: '  ' }], actorId: 'editor' }),
    ).toThrow('summary is required')
    expect(() =>
      normalizeCorrectionLedger({
        previous: [],
        proposed: [{ summary: 'x'.repeat(501) }],
        actorId: 'editor',
      }),
    ).toThrow('500 characters or fewer')
  })
})
