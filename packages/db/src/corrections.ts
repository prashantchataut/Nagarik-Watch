type CorrectionRow = Record<string, unknown>

const MAX_CORRECTION_LENGTH = 500

function asRow(value: unknown): CorrectionRow {
  return typeof value === 'object' && value !== null ? (value as CorrectionRow) : {}
}

function relationId(value: unknown): string {
  const record = asRow(value)
  return String(record.id ?? value ?? '')
}

/**
 * A timestamp as the instant it names, not as the way it happens to be spelled.
 *
 * `at` is a Payload `date` field, so the two sides of the immutability check
 * arrive in different shapes: `originalDoc` comes back from Postgres with a JS
 * `Date`, while a client resubmits the same row with an ISO string. Comparing
 * those with `String()` produces 'Sun Sep 20 2026 15:45:00 GMT+0545' against
 * '2026-09-20T10:00:00.000Z', so an untouched row looked edited and *every*
 * subsequent save of a corrected article was rejected as an immutability
 * violation. The guard became a lockout, on precisely the articles that had
 * already needed fixing once.
 *
 * Falls back to the raw string for an unparseable value so a malformed row
 * still compares equal to itself rather than throwing here.
 */
function instant(value: unknown): string {
  if (value === null || value === undefined) return ''
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString()
}

function immutableCorrection(row: CorrectionRow) {
  return {
    at: instant(row.at),
    summary: String(row.summary ?? ''),
    madeBy: relationId(row.madeBy),
  }
}

/** Fields the server owns. A client cannot choose any of them, including the row id. */
function withoutServerOwnedFields(row: CorrectionRow): CorrectionRow {
  const { id: _id, at: _at, madeBy: _madeBy, ...rest } = row
  return rest
}

/** True when the ledger is unchanged, so callers can skip the publisher check. */
export function correctionLedgersMatch(previous: unknown, proposed: unknown): boolean {
  const before = Array.isArray(previous) ? previous.map(asRow) : []
  const after = Array.isArray(proposed) ? proposed.map(asRow) : []
  if (before.length !== after.length) return false
  return before.every(
    (entry, index) =>
      JSON.stringify(immutableCorrection(entry)) ===
      JSON.stringify(immutableCorrection(after[index]!)),
  )
}

/**
 * Turns Payload's article corrections array into an append-only ledger.
 *
 * Existing entries must remain byte-for-byte equivalent in their public and
 * attribution fields. New rows receive their timestamp and actor on the
 * server, so a CMS client cannot backdate a correction or attribute it to
 * somebody else.
 */
export function normalizeCorrectionLedger({
  previous,
  proposed,
  actorId,
  now = new Date().toISOString(),
}: {
  previous: unknown
  proposed: unknown
  actorId: string
  now?: string
}): CorrectionRow[] {
  const before = Array.isArray(previous) ? previous.map(asRow) : []
  const after = Array.isArray(proposed) ? proposed.map(asRow) : []

  if (after.length < before.length) {
    throw new Error('Published corrections are append-only and cannot be removed.')
  }

  before.forEach((entry, index) => {
    if (
      JSON.stringify(immutableCorrection(entry)) !==
      JSON.stringify(immutableCorrection(after[index]!))
    ) {
      throw new Error('Published corrections are immutable. Add a new correction instead.')
    }
  })

  const additions = after.slice(before.length).map((entry) => {
    const summary = String(entry.summary ?? '').trim()
    if (!summary) throw new Error('A correction summary is required.')
    if (summary.length > MAX_CORRECTION_LENGTH) {
      throw new Error(`A correction summary must be ${MAX_CORRECTION_LENGTH} characters or fewer.`)
    }
    return {
      ...withoutServerOwnedFields(entry),
      at: now,
      summary,
      madeBy: actorId,
    }
  })

  return [...before, ...additions]
}
