export type OpsMigration = {
  id: string
  filename: string
  sql: string
}

const MIGRATION_NAME = /^(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/i

/** Parse and sort filesystem migration filenames into a stable apply order. */
export function planOpsMigrations(
  files: Array<{ filename: string; sql: string }>,
  appliedIds: readonly string[] = [],
): { migrations: OpsMigration[]; pending: OpsMigration[] } {
  const applied = new Set(appliedIds)
  const migrations = files
    .map((file) => {
      const match = MIGRATION_NAME.exec(file.filename)
      if (!match) return null
      const id = `${match[1]}_${match[2]}`.toLowerCase()
      return { id, filename: file.filename, sql: file.sql.trim() } satisfies OpsMigration
    })
    .filter((item): item is OpsMigration => Boolean(item && item.sql))
    .sort((a, b) => a.id.localeCompare(b.id))

  const seen = new Set<string>()
  for (const migration of migrations) {
    if (seen.has(migration.id)) {
      throw new Error(`Duplicate ops migration id: ${migration.id}`)
    }
    seen.add(migration.id)
  }

  return {
    migrations,
    pending: migrations.filter((migration) => !applied.has(migration.id)),
  }
}

export const OPS_MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS nw_ops_migrations (
  id text PRIMARY KEY,
  filename text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`
