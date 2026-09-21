/**
 * Conservative Nepali (Devanagari) + light Latin stemmer.
 *
 * Why this exists: Nepali news copy is agglutinative — बजेट appears in running
 * text as बजेटमा, बजेटको, बजेटले, बजेटहरूको. The search index used to cope by
 * storing *every* prefix of every token (बजेट → ब, बज, बजे, बजेट, बजेटम…),
 * which multiplies the inverted index by the average token length and gives
 * two-character keys a document frequency close to the corpus size, flattening
 * the IDF term they were supposed to feed. Stripping the suffix instead stores
 * one key per token and makes बजेटमा and बजेटको collide on the stem they share.
 *
 * It is deliberately a suffix stripper, not a morphological analyser: it only
 * removes the postposition / plural / participle endings that are frequent in
 * news copy, and only when enough of the word survives. Over-stemming is worse
 * than under-stemming for search, because a bad merge is invisible to the
 * reader while a missed inflection just costs one recall hit that the query-time
 * prefix fallback usually recovers.
 */

/**
 * Devanagari code points that hang off a base letter rather than standing as
 * one: candrabindu/anusvara/visarga, the matras, virama, and the ZW joiners.
 */
const COMBINING = /[\u0900-\u0903\u093A-\u094F\u0951-\u0957\u0962\u0963\u200C\u200D]/u

const DEVANAGARI = /[\u0900-\u097F]/u

/**
 * Count aksharas (written syllables), not UTF-16 units: नेपाल is five code
 * points but three letters, and the minimum-stem guard has to reason in
 * letters or it will happily reduce मामा to मा.
 */
export function aksharaCount(text: string): number {
  let count = 0
  for (const ch of text) if (!COMBINING.test(ch)) count += 1
  return count
}

/** Below this many aksharas a candidate stem is assumed to be a false strip. */
const MIN_STEM_AKSHARAS = 2

/** Case clitics and postpositions that attach directly to the noun. */
const CASE_SUFFIXES = [
  'लाई',
  'बाट',
  'सँग',
  'सित',
  'सम्म',
  'देखि',
  'तिर',
  'माथि',
  'भित्र',
  'बाहिर',
  'द्वारा',
  'प्रति',
  'बिना',
  'विना',
  'को',
  'का',
  'की',
  'ले',
  'मा',
  'कै',
  'नै',
]

/** Plural markers. Both ऊ and उ spellings occur in the wild. */
const PLURAL_SUFFIXES = ['हरू', 'हरु']

/**
 * Participle / infinitive endings common enough in headlines to be worth
 * merging (गरेको / गर्ने / गर्नु all point at the same story).
 */
const VERBAL_SUFFIXES = ['एको', 'एका', 'एकी', 'िएको', 'ँदै', 'दै', 'ने', 'नु']

/** Longest-match-first: हरूको must be tried before को. */
const NEPALI_SUFFIXES: readonly string[] = [
  ...PLURAL_SUFFIXES.flatMap((plural) => CASE_SUFFIXES.map((suffix) => `${plural}${suffix}`)),
  ...PLURAL_SUFFIXES,
  ...CASE_SUFFIXES,
  ...VERBAL_SUFFIXES,
].sort((a, b) => b.length - a.length)

/**
 * Fold the spelling variants that Nepali keyboards produce for the same sound,
 * so काठमाडौं and काठमाडौँ reach the same posting list.
 */
export function foldNepaliSpelling(token: string): string {
  return token
    .replace(/ँ/g, 'ं') // candrabindu → anusvara
    .replace(/[\u200C\u200D]/gu, '')
    .replace(/हरु/g, 'हरू')
}

function stripOnce(token: string): string {
  for (const suffix of NEPALI_SUFFIXES) {
    if (!token.endsWith(suffix) || token.length === suffix.length) continue
    const candidate = token.slice(0, token.length - suffix.length)
    if (aksharaCount(candidate) < MIN_STEM_AKSHARAS) continue
    return candidate
  }
  return token
}

/**
 * Strip at most two suffix layers — नेपालहरूको is covered by the combined
 * plural+case list in one pass, and a third pass has no attested payoff but
 * plenty of ways to eat a real word.
 */
export function stemNepali(token: string): string {
  let current = foldNepaliSpelling(token)
  for (let pass = 0; pass < 2; pass += 1) {
    const next = stripOnce(current)
    if (next === current) break
    current = next
  }
  // A strip can leave a dangling virama (गर्ने → गर्); harmless for matching
  // as long as both sides of the comparison are stemmed the same way.
  return current
}

/**
 * Plural-only Latin stemming. Anything more aggressive (Porter) starts merging
 * unrelated English words in a corpus this small, where the English side is
 * mostly proper nouns and headline fragments.
 */
export function stemLatin(token: string): string {
  let current = token
  if (current.endsWith("'s") || current.endsWith('’s')) current = current.slice(0, -2)
  if (current.length <= 3) return current
  if (current.endsWith('ies') && current.length > 4) return `${current.slice(0, -3)}y`
  if (
    current.endsWith('s') &&
    !current.endsWith('ss') &&
    !current.endsWith('us') &&
    !current.endsWith('is')
  ) {
    return current.slice(0, -1)
  }
  return current
}

/** Stem a single already-normalized token, dispatching on script. */
export function stemToken(token: string): string {
  if (!token) return token
  if (DEVANAGARI.test(token)) return stemNepali(token)
  if (/^[a-z0-9'’-]+$/i.test(token)) return stemLatin(token)
  return token
}

/** Stem every token in a whitespace-separated string, dropping empties. */
export function stemTokens(tokens: readonly string[]): string[] {
  const out: string[] = []
  for (const token of tokens) {
    const stem = stemToken(token)
    if (stem) out.push(stem)
  }
  return out
}
