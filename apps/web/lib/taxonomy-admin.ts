import 'server-only'
import { categories } from '@/lib/content/seed/categories'
import { asSlug, cleanMultiline, cleanText, ensureOperationalSchema, requireOperationalPool, toIso, type Queryable } from '@/lib/ops-db'

export type TaxonomyKind = 'category' | 'tag' | 'author'
export type TaxonomyStatus = 'active' | 'hidden' | 'archived'

export type TaxonomyTerm = {
  id: string
  kind: TaxonomyKind
  slug: string
  nameNe: string
  nameEn: string
  descriptionNe?: string
  descriptionEn?: string
  status: TaxonomyStatus
  sortOrder: number
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

type Row = {
  id: string
  kind: TaxonomyKind
  slug: string
  name_ne: string
  name_en: string
  description_ne: string | null
  description_en: string | null
  status: TaxonomyStatus
  sort_order: number
  metadata: Record<string, unknown>
  created_at: Date | string
  updated_at: Date | string
}

const memory = new Map<string, TaxonomyTerm>()

function seedMemory() {
  if (memory.size) return
  for (const category of categories) {
    const now = new Date().toISOString()
    const term: TaxonomyTerm = {
      id: category.id,
      kind: 'category',
      slug: category.slug,
      nameNe: category.nameNe,
      nameEn: category.nameEn ?? category.nameNe,
      descriptionNe: category.descriptionNe,
      descriptionEn: category.descriptionEn,
      status: category.showInNav === false ? 'hidden' : 'active',
      sortOrder: category.navOrder ?? 100,
      metadata: { showInNav: category.showInNav !== false },
      createdAt: now,
      updatedAt: now,
    }
    memory.set(`${term.kind}:${term.slug}`, term)
  }
  const tags = [
    ['breaking', 'ब्रेकिङ', 'Breaking'],
    ['explainer', 'व्याख्या', 'Explainer'],
    ['investigation', 'छानबिन', 'Investigation'],
    ['public-interest', 'सार्वजनिक हित', 'Public Interest'],
  ] as const
  for (const [slug, nameNe, nameEn] of tags) {
    const now = new Date().toISOString()
    memory.set(`tag:${slug}`, {
      id: `tag-${slug}`,
      kind: 'tag',
      slug,
      nameNe,
      nameEn,
      status: 'active',
      sortOrder: 100,
      metadata: {},
      createdAt: now,
      updatedAt: now,
    })
  }
}

async function ensureSchema(): Promise<Queryable | null> {
  return requireOperationalPool(await ensureOperationalSchema('taxonomy-admin', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_taxonomy_terms (
        id text PRIMARY KEY,
        kind text NOT NULL,
        slug text NOT NULL,
        name_ne text NOT NULL,
        name_en text NOT NULL,
        description_ne text,
        description_en text,
        status text NOT NULL DEFAULT 'active',
        sort_order integer NOT NULL DEFAULT 100,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(kind, slug)
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS nw_taxonomy_terms_kind_idx ON nw_taxonomy_terms(kind, status, sort_order)`)
  }))
}

function id(kind: TaxonomyKind, slug: string): string {
  return `${kind}_${slug}_${Date.now().toString(36)}`.slice(0, 120)
}

function rowToTerm(row: Row): TaxonomyTerm {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    nameNe: row.name_ne,
    nameEn: row.name_en,
    descriptionNe: row.description_ne ?? undefined,
    descriptionEn: row.description_en ?? undefined,
    status: row.status,
    sortOrder: row.sort_order,
    metadata: row.metadata ?? {},
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function asKind(value: unknown): TaxonomyKind {
  if (value === 'tag' || value === 'author') return value
  return 'category'
}

function asStatus(value: unknown): TaxonomyStatus {
  if (value === 'hidden' || value === 'archived') return value
  return 'active'
}

export async function listTaxonomyTerms(kind?: TaxonomyKind): Promise<TaxonomyTerm[]> {
  seedMemory()
  const pool = await ensureSchema()
  if (pool) {
    const result = kind
      ? await pool.query<Row>(`SELECT * FROM nw_taxonomy_terms WHERE kind = $1 ORDER BY sort_order ASC, name_ne ASC`, [kind])
      : await pool.query<Row>(`SELECT * FROM nw_taxonomy_terms ORDER BY kind ASC, sort_order ASC, name_ne ASC`)
    if (result.rows.length) return result.rows.map(rowToTerm)
  }
  const terms = Array.from(memory.values())
  return (kind ? terms.filter((term) => term.kind === kind) : terms).sort((a, b) =>
    a.sortOrder === b.sortOrder ? a.nameNe.localeCompare(b.nameNe) : a.sortOrder - b.sortOrder,
  )
}

export async function upsertTaxonomyTerm(input: {
  kind: unknown
  slug?: unknown
  nameNe: unknown
  nameEn?: unknown
  descriptionNe?: unknown
  descriptionEn?: unknown
  status?: unknown
  sortOrder?: unknown
  metadata?: Record<string, unknown>
}): Promise<TaxonomyTerm> {
  const kind = asKind(input.kind)
  const nameNe = cleanText(input.nameNe, 120)
  const nameEn = cleanText(input.nameEn || input.nameNe, 120)
  const slug = asSlug(input.slug || nameEn || nameNe, kind)
  const term: TaxonomyTerm = {
    id: id(kind, slug),
    kind,
    slug,
    nameNe: nameNe || nameEn || slug,
    nameEn: nameEn || nameNe || slug,
    descriptionNe: cleanMultiline(input.descriptionNe, 1000) || undefined,
    descriptionEn: cleanMultiline(input.descriptionEn, 1000) || undefined,
    status: asStatus(input.status),
    sortOrder: Number(input.sortOrder) || 100,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_taxonomy_terms (id, kind, slug, name_ne, name_en, description_ne, description_en, status, sort_order, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
       ON CONFLICT (kind, slug) DO UPDATE SET
         name_ne = EXCLUDED.name_ne,
         name_en = EXCLUDED.name_en,
         description_ne = EXCLUDED.description_ne,
         description_en = EXCLUDED.description_en,
         status = EXCLUDED.status,
         sort_order = EXCLUDED.sort_order,
         metadata = EXCLUDED.metadata,
         updated_at = now()
       RETURNING *`,
      [term.id, term.kind, term.slug, term.nameNe, term.nameEn, term.descriptionNe ?? null, term.descriptionEn ?? null, term.status, term.sortOrder, JSON.stringify(term.metadata)],
    )
    return rowToTerm(result.rows[0]!)
  }
  const existing = memory.get(`${term.kind}:${term.slug}`)
  memory.set(`${term.kind}:${term.slug}`, existing ? { ...existing, ...term, id: existing.id, createdAt: existing.createdAt } : term)
  return memory.get(`${term.kind}:${term.slug}`)!
}

export async function archiveTaxonomyTerm(kind: TaxonomyKind, slug: string): Promise<boolean> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query(`UPDATE nw_taxonomy_terms SET status = 'archived', updated_at = now() WHERE kind = $1 AND slug = $2`, [kind, slug])
    return Number(result.rowCount ?? 0) > 0
  }
  const term = memory.get(`${kind}:${slug}`)
  if (!term) return false
  memory.set(`${kind}:${slug}`, { ...term, status: 'archived', updatedAt: new Date().toISOString() })
  return true
}
