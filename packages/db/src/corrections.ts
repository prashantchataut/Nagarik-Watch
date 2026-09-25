type CorrectionRow = Record<string, unknown>

const MAX_CORRECTION_LENGTH = 500

function asRow(value: unknown): CorrectionRow {
  return typeof value === 'object' && value !== null ? (value as CorrectionRow) : {}
}

function relationId(value: unknown): string {
  const record = asRow(value)
  return String(record.id ?? value ?? '')
}

function immutableCorrection(row: CorrectionRow) {
  return {
    at: String(row.at ?? ''),
    summary: String(row.summary ?? ''),
    madeBy: relationId(row.madeBy),
  }
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
      ...entry,
      at: now,
      summary,
      madeBy: actorId,
    }
  })

  return [...before, ...additions]
}
