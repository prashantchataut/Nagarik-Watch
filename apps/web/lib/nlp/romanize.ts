/**
 * Devanagari → Latin romanization, tuned for search rather than for accuracy.
 *
 * Why this exists: most Nepali readers on a phone type Latin. They search
 * `kathmandu`, `bajet`, `oli`, `pradhanmantri` — and until now none of those
 * could reach a story headlined काठमाडौं, बजेट, ओली or प्रधानमन्त्री. The
 * bilingual lexicon in `lib/search-lexicon` covers ten curated civic pairs,
 * which is the wrong shape of answer: news queries are overwhelmingly proper
 * nouns, and a hand-maintained table can never enumerate the people, districts
 * and parties a newsroom writes about next week.
 *
 * Why not the `transliteration` package the slug builder uses: it romanizes for
 * URL stability, so it drops the inherent vowel entirely and doubles the long
 * ones. Measured on this corpus's vocabulary it returns `bjett` for बजेट,
 * `prdhaanmntrii` for प्रधानमन्त्री and `kaatthmaaddauN` for काठमाडौं. Nobody
 * types those. It is also 3.5 MB on disk, and `lib/search` builds its index in
 * the browser as well as on the server, so its dependencies are shipped.
 *
 * Two keys come out of here, because Latin spelling of Nepali is not a
 * function — it is a cloud of conventions:
 *
 *   `romanize()`  — a readable, permissive spelling. Fold vowel length (ी and ि
 *                   both `i`), fold the retroflex/dental pairs (ट and त both
 *                   `t`), keep the aspiration digraphs, keep the inherent `a`,
 *                   and delete the word-final one the way Nepali does. नेपाल →
 *                   `nepal`, बजेट → `bajet`, ओली → `oli`. This is an exact hit
 *                   for the way most readers type most words.
 *
 *   `skeleton()`  — consonants only, with the distinctions readers actually
 *                   disagree about removed: vowels, aspiration `h`, the nasal
 *                   `n`, and the v/w/b that makes विराटनगर and बिराटनगर the same
 *                   city. काठमाडौं romanizes to `kathamadau`, which is three
 *                   edits from `kathmandu` and so out of fuzzy reach; both
 *                   reduce to `ktmd`. Lossy on purpose, and therefore scored
 *                   well below everything else and consulted only when a query
 *                   term found nothing at all.
 *
 * Residual spelling variance between those two — `swasthya` against `svasthy`,
 * `pradhanmantri` against `pradhanamantri` — is already handled: `search.ts`
 * fuzzy-expands Latin query terms within edit distance 2 over the vocabulary,
 * and these keys join that vocabulary. So this module deliberately does not try
 * to be exhaustive; it tries to land inside the existing recovery radius.
 */

/** Consonants, with the retroflex/dental and sibilant series folded together. */
const CONSONANTS: Record<string, string> = {
  क: 'k',
  ख: 'kh',
  ग: 'g',
  घ: 'gh',
  ङ: 'n',
  च: 'ch',
  छ: 'chh',
  ज: 'j',
  झ: 'jh',
  ञ: 'n',
  ट: 't',
  ठ: 'th',
  ड: 'd',
  ढ: 'dh',
  ण: 'n',
  त: 't',
  थ: 'th',
  द: 'd',
  ध: 'dh',
  न: 'n',
  प: 'p',
  फ: 'ph',
  ब: 'b',
  भ: 'bh',
  म: 'm',
  य: 'y',
  र: 'r',
  ल: 'l',
  ळ: 'l',
  व: 'v',
  श: 'sh',
  ष: 'sh',
  स: 's',
  ह: 'h',
  // Nukta letters. Nepali keyboards emit both these precomposed forms and the
  // base letter plus U+093C, which `stripNukta` below folds onto the base.
  क़: 'k',
  ख़: 'kh',
  ग़: 'g',
  ज़: 'z',
  ड़: 'r',
  ढ़: 'rh',
  फ़: 'f',
  य़: 'y',
}

/** Independent vowels. Long and short collapse: readers do not distinguish them. */
const VOWELS: Record<string, string> = {
  अ: 'a',
  आ: 'a',
  इ: 'i',
  ई: 'i',
  उ: 'u',
  ऊ: 'u',
  ऋ: 'ri',
  ॠ: 'ri',
  ऌ: 'li',
  ॡ: 'li',
  ए: 'e',
  ऐ: 'ai',
  ओ: 'o',
  औ: 'au',
  ऍ: 'e',
  ऎ: 'e',
  ऑ: 'o',
  ऒ: 'o',
}

/** Dependent vowel signs (matras), folded the same way as the independents. */
const MATRAS: Record<string, string> = {
  'ा': 'a', // ा
  'ि': 'i', // ि
  'ी': 'i', // ी
  'ु': 'u', // ु
  'ू': 'u', // ू
  'ृ': 'ri', // ृ
  'ॄ': 'ri', // ॄ
  'ॢ': 'li', // ॢ
  'ॣ': 'li', // ॣ
  'ॅ': 'e', // ॅ
  'ॆ': 'e', // ॆ
  'े': 'e', // े
  'ै': 'ai', // ै
  'ॉ': 'o', // ॉ
  'ॊ': 'o', // ॊ
  'ो': 'o', // ो
  'ौ': 'au', // ौ
}

const VIRAMA = '्'
const ANUSVARA = 'ं'
const CANDRABINDU = 'ँ'
const VISARGA = 'ः'
const NUKTA = '़'

const DEVANAGARI_DIGITS = '०१२३४५६७८९'

const DEVANAGARI = /[ऀ-ॿ]/u

/**
 * Drop the combining nukta rather than map every base+nukta pair: the sounds it
 * marks (ज़, ड़) fold onto their base letter under this scheme anyway.
 */
function stripNukta(text: string): string {
  return text.replaceAll(NUKTA, '')
}

/**
 * Romanize one token. Returns `''` for a token with no Devanagari in it, so a
 * caller can use a non-empty result as "this produced a new key".
 *
 * The loop walks aksharas, not code points: a matra belongs to the consonant
 * before it, and the inherent `a` is only emitted when no matra and no virama
 * claim that slot. (A hand-rolled attempt elsewhere in the repo got this wrong
 * by treating ने as two independent characters; see packages/db/src/slug.ts.)
 */
export function romanize(token: string): string {
  if (!DEVANAGARI.test(token)) return ''
  const chars = [...stripNukta(token)]

  // Aksharas remaining tells us whether we are on the last letter, which is
  // where the inherent vowel is deleted.
  let letters = 0
  for (const ch of chars) if (CONSONANTS[ch] || VOWELS[ch]) letters += 1
  const multiSyllable = letters >= 2

  let out = ''
  let seen = 0
  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i] as string
    const digit = DEVANAGARI_DIGITS.indexOf(ch)
    if (digit >= 0) {
      out += String(digit)
      continue
    }
    const vowel = VOWELS[ch]
    if (vowel) {
      seen += 1
      out += vowel
      continue
    }
    const consonant = CONSONANTS[ch]
    if (!consonant) {
      // Anusvara and candrabindu become `n` between letters, and are dropped at
      // the end of a word. काठमाडौं keeps its nasal in speech but readers move
      // it (`kathmandu`), so a trailing `n` only adds an edit; medially the `n`
      // is what they type (`sansad`, `kangres`).
      if (ch === ANUSVARA || ch === CANDRABINDU) {
        if (seen < letters) out += 'n'
        continue
      }
      // Visarga and avagraha carry no sound a Latin typist reproduces.
      if (ch === VISARGA) continue
      continue
    }

    seen += 1
    out += consonant
    const next = chars[i + 1]
    if (next === VIRAMA) {
      i += 1 // conjunct or dead consonant: no vowel in this slot
      continue
    }
    if (next !== undefined && MATRAS[next] !== undefined) {
      out += MATRAS[next]
      i += 1
      continue
    }
    // Inherent vowel, except on the final letter of a word of two or more.
    if (!(multiSyllable && seen === letters)) out += 'a'
  }
  return out
}

/**
 * Four consonants, not three. Three-letter skeletons are where this stops
 * identifying a word: गण्डकी reduces to `gdk`, and it does not need to — its
 * romanization `gandaki` is already exactly what a reader types. The skeletons
 * that earn their place are the ones the romanization cannot reach on its own,
 * and those come from longer words (`ktmd`, `srbc`, `brtgr`).
 */
const SKELETON_MIN_LENGTH = 4

/**
 * Reduce an already-Latin string to the consonants readers agree on.
 *
 * Dropped: vowels (length and quality are the least stable part of any
 * romanization), the aspiration `h` (`katmandu` and `kathmandu` are the same
 * word to everyone typing it), the nasal `n` (its position moves — `kathmandu`
 * against `kathmadau`), and the v/w/b distinction (विराटनगर and बिराटनगर are
 * both written and both typed). `m` is kept: dropping every nasal leaves too
 * little of a word to be worth matching.
 *
 * Returns `''` when too little survives to identify a word — see
 * `SKELETON_MIN_LENGTH`.
 */
export function skeleton(latin: string): string {
  let out = ''
  for (const ch of latin.toLowerCase()) {
    if (ch >= '0' && ch <= '9') {
      out += ch
      continue
    }
    if (ch < 'a' || ch > 'z') continue
    if (ch === 'a' || ch === 'e' || ch === 'i' || ch === 'o' || ch === 'u') continue
    if (ch === 'h' || ch === 'n') continue
    let folded = ch
    if (ch === 'w' || ch === 'v') folded = 'b'
    else if (ch === 'z') folded = 'j'
    // Collapse a doubled consonant: `sarvochch` and `sarbochcha` should not
    // differ by how many times the writer repeated च.
    if (out.endsWith(folded)) continue
    out += folded
  }
  return out.length >= SKELETON_MIN_LENGTH ? out : ''
}

/**
 * The extra index keys a Devanagari token earns: its romanization and, when the
 * romanization is long enough to be distinctive, its skeleton. Empty for a
 * token that is already Latin — `search.ts` reaches those directly, and its
 * fuzzy expansion already covers Latin misspellings.
 */
export function romanizedKeys(token: string): { roman: string; skeleton: string } | null {
  const roman = romanize(token)
  if (!roman) return null
  return { roman, skeleton: skeleton(roman) }
}
