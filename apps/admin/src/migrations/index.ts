import * as migration_20260708_130036 from './20260708_130036'
import * as migration_20260713_180000_newsroom_rbac_and_slug from './20260713_180000_newsroom_rbac_and_slug'
import * as migration_20260714_090000_notification_distribution from './20260714_090000_notification_distribution'
import * as migration_20260714_140000_editorial_distribution_fields from './20260714_140000_editorial_distribution_fields'
import * as migration_20260816_001000_editorial_delivery_hardening from './20260816_001000_editorial_delivery_hardening'

export const migrations = [
  {
    up: migration_20260708_130036.up,
    down: migration_20260708_130036.down,
    name: '20260708_130036',
  },
  {
    up: migration_20260713_180000_newsroom_rbac_and_slug.up,
    down: migration_20260713_180000_newsroom_rbac_and_slug.down,
    name: '20260713_180000_newsroom_rbac_and_slug',
  },
  {
    up: migration_20260714_090000_notification_distribution.up,
    down: migration_20260714_090000_notification_distribution.down,
    name: '20260714_090000_notification_distribution',
  },
  {
    up: migration_20260714_140000_editorial_distribution_fields.up,
    down: migration_20260714_140000_editorial_distribution_fields.down,
    name: '20260714_140000_editorial_distribution_fields',
  },
  {
    up: migration_20260816_001000_editorial_delivery_hardening.up,
    down: migration_20260816_001000_editorial_delivery_hardening.down,
    name: '20260816_001000_editorial_delivery_hardening',
  },
]
