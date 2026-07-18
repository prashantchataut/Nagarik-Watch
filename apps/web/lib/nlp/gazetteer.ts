export type CivicEntityType = 'place' | 'organization' | 'person'

export type GazetteerEntry = {
  canonical: string
  type: CivicEntityType
  aliases: readonly string[]
}

export type ExtractedEntity = {
  canonical: string
  type: CivicEntityType
  matched: string
  start: number
  end: number
}

/** Small, transparent seed list for newsroom assistance; not a general NER model. */
export const NEPAL_CIVIC_GAZETTEER: readonly GazetteerEntry[] = [
  { canonical: 'काठमाडौं', type: 'place', aliases: ['काठमाडौं', 'काठमाडौँ', 'Kathmandu'] },
  { canonical: 'ललितपुर', type: 'place', aliases: ['ललितपुर', 'पाटन', 'Lalitpur', 'Patan'] },
  { canonical: 'पोखरा', type: 'place', aliases: ['पोखरा', 'Pokhara'] },
  { canonical: 'मधेश प्रदेश', type: 'place', aliases: ['मधेश प्रदेश', 'Madhesh Province'] },
  { canonical: 'नेपाल सरकार', type: 'organization', aliases: ['नेपाल सरकार', 'Government of Nepal'] },
  { canonical: 'निर्वाचन आयोग', type: 'organization', aliases: ['निर्वाचन आयोग', 'Election Commission Nepal'] },
  { canonical: 'नेपाल राष्ट्र बैंक', type: 'organization', aliases: ['नेपाल राष्ट्र बैंक', 'Nepal Rastra Bank'] },
  { canonical: 'सर्वोच्च अदालत', type: 'organization', aliases: ['सर्वोच्च अदालत', 'Supreme Court of Nepal'] },
  { canonical: 'रामचन्द्र पौडेल', type: 'person', aliases: ['रामचन्द्र पौडेल', 'Ram Chandra Paudel'] },
  { canonical: 'केपी शर्मा ओली', type: 'person', aliases: ['केपी शर्मा ओली', 'के.पी. शर्मा ओली', 'KP Sharma Oli'] },
] as const

const INDEX = NEPAL_CIVIC_GAZETTEER.flatMap((entry) =>
  entry.aliases.map((alias) => ({ entry, alias, needle: alias.toLocaleLowerCase('en') })),
).sort((a, b) => b.alias.length - a.alias.length)

function isWordCharacter(value: string | undefined): boolean {
  return Boolean(value && /[\p{L}\p{N}\p{M}]/u.test(value))
}

/** Gazetteer matching is deterministic and returns offsets for editor review. */
export function extractEntities(text: string): ExtractedEntity[] {
  if (!text.trim()) return []
  const haystack = text.toLocaleLowerCase('en')
  const matches: ExtractedEntity[] = []

  for (const { entry, alias, needle } of INDEX) {
    let from = 0
    while (from < haystack.length) {
      const start = haystack.indexOf(needle, from)
      if (start === -1) break
      const end = start + alias.length
      const startsCleanly = !isWordCharacter(haystack[start - 1])
      const bounded = /[\u0900-\u097f]/u.test(alias)
        ? startsCleanly
        : startsCleanly && !isWordCharacter(haystack[end])
      const overlaps = matches.some((match) => start < match.end && end > match.start)
      if (bounded && !overlaps) {
        matches.push({
          canonical: entry.canonical,
          type: entry.type,
          matched: text.slice(start, end),
          start,
          end,
        })
      }
      from = start + Math.max(1, needle.length)
    }
  }

  return matches.sort((a, b) => a.start - b.start || b.end - a.end)
}
