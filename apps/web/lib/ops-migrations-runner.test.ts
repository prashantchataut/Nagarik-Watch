import { describe, expect, it } from 'vitest'
import { loadMigrationFiles, listPendingOpsMigrationIds } from './ops-migrations-runner'

describe('operational migration files', () => {
  it('discovers the checked-in operational migration plan', async () => {
    const files = await loadMigrationFiles()
    expect(files.map((file) => file.filename)).toEqual(expect.arrayContaining([
      '0001_core_operational.sql',
      '0002_engagement_indexes.sql',
      '0003_comms_and_privacy.sql',
      '0004_admin_ops.sql',
      '0005_newsroom_and_content.sql',
      '0009_rate_limit_token_bucket.sql',
    ]))
    expect(await listPendingOpsMigrationIds()).toEqual(expect.arrayContaining([
      '0001_core_operational',
      '0002_engagement_indexes',
      '0003_comms_and_privacy',
      '0004_admin_ops',
      '0005_newsroom_and_content',
      '0009_rate_limit_token_bucket',
    ]))
  })
})
