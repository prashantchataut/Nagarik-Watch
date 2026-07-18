import { describe, expect, it } from 'vitest'
import { planOpsMigrations } from './ops-migrations-core'

describe('planOpsMigrations', () => {
  it('orders by numeric prefix and skips applied ids', () => {
    const plan = planOpsMigrations(
      [
        { filename: '0002_more.sql', sql: 'SELECT 2;' },
        { filename: '0001_core_operational.sql', sql: 'SELECT 1;' },
        { filename: 'readme.md', sql: 'ignore' },
      ],
      ['0001_core_operational'],
    )
    expect(plan.migrations.map((item) => item.id)).toEqual([
      '0001_core_operational',
      '0002_more',
    ])
    expect(plan.pending.map((item) => item.id)).toEqual(['0002_more'])
  })

  it('rejects duplicate migration ids', () => {
    expect(() =>
      planOpsMigrations([
        { filename: '0001_core.sql', sql: 'SELECT 1;' },
        { filename: '0001_core.sql', sql: 'SELECT 2;' },
      ]),
    ).toThrow(/Duplicate/)
  })
})
