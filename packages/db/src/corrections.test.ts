import { describe, expect, it } from 'vitest'
import { correctionLedgersMatch, normalizeCorrectionLedger } from './corrections'

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

  // `at` is a Payload `date` field, so the existing row arrives from Postgres as
  // a JS Date while the client resubmits it as an ISO string. Comparing those as
  // raw strings made an untouched row look edited, which rejected every save of
  // any article that already carried a correction. The tests above could not see
  // it because both sides were string literals.
  it('treats a Date-hydrated row as unchanged against its ISO string', () => {
    const fromDb = { ...issued, at: new Date('2026-09-20T10:00:00.000Z') }
    expect(
      normalizeCorrectionLedger({ previous: [fromDb], proposed: [issued], actorId: 'publisher-2' }),
    ).toEqual([fromDb])
  })

  it('still rejects a real edit when the timestamps are differently shaped', () => {
    const fromDb = { ...issued, at: new Date('2026-09-20T10:00:00.000Z') }
    expect(() =>
      normalizeCorrectionLedger({
        previous: [fromDb],
        proposed: [{ ...issued, summary: 'A quieter version.' }],
        actorId: 'publisher-2',
      }),
    ).toThrow('Published corrections are immutable')
  })

  it('does not let a client choose the row id of an appended correction', () => {
    const [, appended] = normalizeCorrectionLedger({
      previous: [issued],
      proposed: [issued, { id: 'row-1', summary: 'Spoofed id.', madeBy: 'spoofed' }],
      actorId: 'publisher-2',
      now: '2026-09-25T12:00:00.000Z',
    })
    expect(appended).toEqual({
      summary: 'Spoofed id.',
      madeBy: 'publisher-2',
      at: '2026-09-25T12:00:00.000Z',
    })
  })
})

describe('correctionLedgersMatch', () => {
  it('sees through the Date/ISO mismatch so an untouched ledger needs no publisher', () => {
    expect(correctionLedgersMatch([{ ...issued, at: new Date(issued.at) }], [issued])).toBe(true)
  })

  it('reports an append, an edit, and a removal as changes', () => {
    expect(correctionLedgersMatch([issued], [issued, { summary: 'New.' }])).toBe(false)
    expect(correctionLedgersMatch([issued], [{ ...issued, summary: 'Edited.' }])).toBe(false)
    expect(correctionLedgersMatch([issued], [])).toBe(false)
  })
})
