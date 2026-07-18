/**
 * Editorial query-expansion lexicon for Nepali↔English civic terms.
 * Kept separate from the BM25 engine so newsroom can extend synonyms without
 * touching ranking math. Keys and values are matched after `normalize()`.
 */

export type QueryLexicon = Readonly<Record<string, readonly string[]>>

/** Curated civic synonym / bilingual expansion table. */
export const CIVIC_QUERY_LEXICON: QueryLexicon = {
  बजेट: ['budget', 'अर्थबजेट', 'fiscal'],
  budget: ['बजेट', 'अर्थबजेट', 'fiscal'],
  बाढी: ['flood', 'वर्षात्', 'inundation'],
  flood: ['बाढी', 'वर्षात्', 'inundation'],
  चुनाव: ['election', 'मतदान', 'poll'],
  election: ['चुनाव', 'मतदान', 'poll'],
  संसद: ['parliament', 'प्रतिनिधिसभा', 'legislature'],
  parliament: ['संसद', 'प्रतिनिधिसभा', 'legislature'],
  भ्रष्टाचार: ['corruption', 'घूस', 'graft'],
  corruption: ['भ्रष्टाचार', 'घूस', 'graft'],
  मुद्रास्फीति: ['inflation', 'महँगी'],
  inflation: ['मुद्रास्फीति', 'महँगी'],
  नेप्से: ['nepse', 'शेयरबजार', 'stock'],
  nepse: ['नेप्से', 'शेयरबजार', 'stock'],
  प्रदेश: ['province', 'प्रदेशसरकार'],
  province: ['प्रदेश', 'प्रदेशसरकार'],
  महानगर: ['metropolitan', 'नगरपालिका', 'municipality'],
  municipality: ['महानगर', 'नगरपालिका', 'metropolitan'],
}

/** Expand one normalized query term via the lexicon (does not include the term itself). */
export function lexiconExpandTerm(
  term: string,
  lexicon: QueryLexicon = CIVIC_QUERY_LEXICON,
): string[] {
  const key = term.trim()
  if (!key) return []
  const direct = lexicon[key]
  if (direct) return [...direct]
  // Case-insensitive Latin fallback; Devanagari is already case-stable.
  const lower = key.toLowerCase()
  if (lower !== key) {
    const lowered = lexicon[lower]
    if (lowered) return [...lowered]
  }
  return []
}
