import * as migration_20260708_130036 from './20260708_130036';

export const migrations = [
  {
    up: migration_20260708_130036.up,
    down: migration_20260708_130036.down,
    name: '20260708_130036'
  },
];
