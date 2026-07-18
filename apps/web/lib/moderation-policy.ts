/** Pure helpers for newsroom lexical moderation policy (no server runtime). */

/** Parse a newsroom-reviewed banned-word policy from one or more text sources. */
export function parseBannedWordPolicy(...sources: Array<string | null | undefined>): string[] {
  const terms = new Set<string>()
  for (const source of sources) {
    if (!source) continue
    for (const part of source.split(/[\n,]+/)) {
      const term = part.trim()
      if (term.length >= 2) terms.add(term)
    }
  }
  return [...terms]
}
