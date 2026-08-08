import 'server-only'
import {
  cleanText,
  ensureOperationalSchema,
  requireOperationalPool,
  toIso,
  type Queryable,
} from '@/lib/ops-db'
import {
  EDITOR_PREFERENCE_DEFAULTS,
  type EditorDensity,
  type EditorLocalePref,
  type EditorPreferences,
} from '@/lib/editor-preferences-types'

export type { EditorDensity, EditorLocalePref, EditorPreferences } from '@/lib/editor-preferences-types'

type Row = {
  user_id: string
  default_category_slug: string | null
  autosave_seconds: number | null
  density: string | null
  show_formatting_hints: boolean | null
  preferred_locale: string | null
  updated_at: Date | string
}

const memory = new Map<string, EditorPreferences>()

async function ensureSchema(): Promise<Queryable | null> {
  return requireOperationalPool(
    await ensureOperationalSchema('editor-preferences', async (pool) => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_editor_preferences (
          user_id text PRIMARY KEY,
          default_category_slug text,
          autosave_seconds integer NOT NULL DEFAULT 30,
          density text NOT NULL DEFAULT 'comfortable',
          show_formatting_hints boolean NOT NULL DEFAULT true,
          preferred_locale text NOT NULL DEFAULT 'follow',
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
    }),
  )
}

function normalizeDensity(value: unknown): EditorDensity {
  return value === 'compact' ? 'compact' : 'comfortable'
}

function normalizeLocalePref(value: unknown): EditorLocalePref {
  if (value === 'ne' || value === 'en' || value === 'follow') return value
  return 'follow'
}

function normalizeAutosave(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return 30
  return Math.max(10, Math.min(300, Math.round(n)))
}

function rowToPrefs(row: Row): EditorPreferences {
  return {
    userId: row.user_id,
    defaultCategorySlug: row.default_category_slug ?? '',
    autosaveSeconds: normalizeAutosave(row.autosave_seconds ?? 30),
    density: normalizeDensity(row.density),
    showFormattingHints: row.show_formatting_hints !== false,
    preferredLocale: normalizeLocalePref(row.preferred_locale),
    updatedAt: toIso(row.updated_at),
  }
}

export function defaultEditorPreferences(userId: string): EditorPreferences {
  return {
    userId,
    ...EDITOR_PREFERENCE_DEFAULTS,
    updatedAt: new Date(0).toISOString(),
  }
}

export async function getEditorPreferences(userId: string): Promise<EditorPreferences> {
  const id = cleanText(userId, 120)
  if (!id) return defaultEditorPreferences('')
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `SELECT * FROM nw_editor_preferences WHERE user_id = $1 LIMIT 1`,
      [id],
    )
    const row = result.rows[0]
    if (row) return rowToPrefs(row)
    return defaultEditorPreferences(id)
  }
  return memory.get(id) ?? defaultEditorPreferences(id)
}

export async function upsertEditorPreferences(
  userId: string,
  input: Partial<{
    defaultCategorySlug: unknown
    autosaveSeconds: unknown
    density: unknown
    showFormattingHints: unknown
    preferredLocale: unknown
  }>,
): Promise<EditorPreferences> {
  const id = cleanText(userId, 120)
  if (!id) throw new Error('userId required')
  const current = await getEditorPreferences(id)
  const next: EditorPreferences = {
    userId: id,
    defaultCategorySlug:
      input.defaultCategorySlug !== undefined
        ? cleanText(input.defaultCategorySlug, 80)
        : current.defaultCategorySlug,
    autosaveSeconds:
      input.autosaveSeconds !== undefined
        ? normalizeAutosave(input.autosaveSeconds)
        : current.autosaveSeconds,
    density:
      input.density !== undefined ? normalizeDensity(input.density) : current.density,
    showFormattingHints:
      input.showFormattingHints !== undefined
        ? Boolean(input.showFormattingHints)
        : current.showFormattingHints,
    preferredLocale:
      input.preferredLocale !== undefined
        ? normalizeLocalePref(input.preferredLocale)
        : current.preferredLocale,
    updatedAt: new Date().toISOString(),
  }

  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_editor_preferences (
         user_id, default_category_slug, autosave_seconds, density,
         show_formatting_hints, preferred_locale, updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,now())
       ON CONFLICT (user_id) DO UPDATE SET
         default_category_slug = EXCLUDED.default_category_slug,
         autosave_seconds = EXCLUDED.autosave_seconds,
         density = EXCLUDED.density,
         show_formatting_hints = EXCLUDED.show_formatting_hints,
         preferred_locale = EXCLUDED.preferred_locale,
         updated_at = now()
       RETURNING *`,
      [
        next.userId,
        next.defaultCategorySlug || null,
        next.autosaveSeconds,
        next.density,
        next.showFormattingHints,
        next.preferredLocale,
      ],
    )
    return rowToPrefs(result.rows[0]!)
  }

  memory.set(id, next)
  return next
}
