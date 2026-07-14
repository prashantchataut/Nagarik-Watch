import * as migration_20260708_130036 from './20260708_130036'
import * as migration_20260713_180000_newsroom_rbac_and_slug from './20260713_180000_newsroom_rbac_and_slug'

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
]
