/**
 * Preeti ⇄ Unicode (Devanagari) converter.
 *
 * Preeti is a legacy non-Unicode Nepali font: each Latin keystroke renders as a
 * precomposed Devanagari glyph. This module recovers real Unicode text from
 * Preeti-typed source (and lets a Preeti typist produce Unicode).
 *
 * Algorithm: (1) substitute each Latin char/symbol via CHARACTER_MAP to a
 * Devanagari fragment (many carry an inherent halant ्), then (2) apply the
 * POST_RULES regex transforms in order to fix matra ordering, conjunct clusters,
 * vowel merging (अ+ा→आ, अ+ा+े→ओ, …), and degemination. The two-pass model is
 * required because Preeti keystrokes are positional, not phonetic.
 *
 * The character map and rule set follow the standard Preeti keyboard layout
 * (the de-facto Nepali legacy layout). The data is the factual font standard;
 * verified against an independent reference implementation across 31 words
 * (नमस्ते, काठमाडौं, विद्यालय, संविधान, प्रधानमन्त्री, …) — see preeti.test.ts.
 *
 * Pure data + pure functions, no runtime deps — safe on the client.
 */

type Pair = readonly [latin: string, devanagari: string]

// Latin key -> Devanagari output. Outputs ending in ् (U+094D halant) mark a
// half-consonant that joins to the next consonant during POST_RULES.
const CHARACTER_MAP: readonly Pair[] = [
  ['0', '\u0923\u094d'],
  ['1', '\u091c\u094d\u091e'],
  ['2', '\u0926\u094d\u0926'],
  ['3', '\u0918'],
  ['4', '\u0926\u094d\u0927'],
  ['5', '\u091b'],
  ['6', '\u091f'],
  ['7', '\u0920'],
  ['8', '\u0921'],
  ['9', '\u0922'],
  ['~', '\u091e\u094d'],
  ['!', '\u0967'],
  ['@', '\u0968'],
  ['#', '\u0969'],
  ['$', '\u096a'],
  ['%', '\u096b'],
  ['^', '\u096c'],
  ['&', '\u096d'],
  ['*', '\u096e'],
  ['(', '\u096f'],
  [')', '\u0966'],
  ['_', ')'],
  ['+', '\u0902'],
  [' ', ' '],
  ['`', '\u091e'],
  ['-', '('],
  ['=', '.'],
  ['Q', '\u0924\u094d\u0924'],
  ['W', '\u0927\u094d'],
  ['E', '\u092d\u094d'],
  ['R', '\u091a\u094d'],
  ['T', '\u0924\u094d'],
  ['Y', '\u0925\u094d'],
  ['U', '\u0917\u094d'],
  ['I', '\u0915\u094d\u0937\u094d'],
  ['O', '\u0907'],
  ['P', '\u090f'],
  ['}', '\u0948'],
  ['|', '\u094d\u0930'],
  ['q', '\u0924\u094d\u0930'],
  ['w', '\u0927'],
  ['e', '\u092d'],
  ['r', '\u091a'],
  ['t', '\u0924'],
  ['y', '\u0925'],
  ['u', '\u0917'],
  ['i', '\u0937\u094d'],
  ['o', '\u092f'],
  ['p', '\u0909'],
  ['[', '\u0943'],
  [']', '\u0947'],
  ['\\', '\u094d'],
  ['A', '\u092c\u094d'],
  ['S', '\u0915\u094d'],
  ['D', '\u092e\u094d'],
  ['F', '\u0901'],
  ['G', '\u0928\u094d'],
  ['H', '\u091c\u094d'],
  ['J', '\u0935\u094d'],
  ['K', '\u092a\u094d'],
  ['L', '\u0940'],
  [':', '\u0938\u094d'],
  ['"', '\u0942'],
  ['a', '\u092c'],
  ['s', '\u0915'],
  ['d', '\u092e'],
  ['f', '\u093e'],
  ['g', '\u0928'],
  ['h', '\u091c'],
  ['j', '\u0935'],
  ['k', '\u092a'],
  ['l', '\u093f'],
  [';', '\u0938'],
  ["'", '\u0941'],
  ['Z', '\u0936\u094d'],
  ['X', '\u0939\u094d'],
  ['C', '\u090b'],
  ['V', '\u0916\u094d'],
  ['B', '\u0926\u094d\u092f'],
  ['N', '\u0932\u094d'],
  ['M', '\u0903'],
  ['<', '?'],
  ['>', '\u0936\u094d\u0930'],
  ['?', '\u0930\u0941'],
  ['z', '\u0936'],
  ['x', '\u0939'],
  ['c', '\u0905'],
  ['v', '\u0916'],
  ['b', '\u0926'],
  ['n', '\u0932'],
  [',', ','],
  ['.', '\u0964'],
  ['/', '\u0930'],
  ['\u201e', '\u0927\u094d\u0930'],
  ['\u2026', '\u2018'],
  ['\u02c6', '\u092b\u094d'],
  ['\u2030', '\u091d\u094d'],
  ['\u2039', '\u0919\u094d\u0918'],
  ['\u2018', '\u0945'],
  ['\u2022', '\u0921\u094d\u0921'],
  ['\u02dc', '\u093d'],
  ['\u203a', '\u0926\u094d\u0930'],
  ['\u00a1', '\u091c\u094d\u091e\u094d'],
  ['\u00a2', '\u0926\u094d\u0918'],
  ['\u00a3', '\u0918\u094d'],
  ['\u00a4', '\u091d\u094d'],
  ['\u00a5', '\u094d\u0930'],
  ['\u00a7', '\u091f\u094d\u091f'],
  ['\u00a9', '\u0930'],
  ['\u00aa', '\u0919'],
  ['\u00ab', '\u094d\u0930'],
  ['\u00b0', '\u0919\u094d\u0922'],
  ['\u00b1', '+'],
  ['\u00b4', '\u091d'],
  ['\u00b6', '\u0920\u094d\u0920'],
  ['\u00bf', '\u0930\u0942'],
  ['\u00c5', '\u0939\u0943'],
  ['\u00c6', '\u201d'],
  ['\u00cb', '\u0919\u094d\u0917'],
  ['\u00cc', '\u0928\u094d\u0928'],
  ['\u00cd', '\u0919\u094d\u0915'],
  ['\u00ce', '\u0919\u094d\u0916'],
  ['\u00d2', '\u00a8'],
  ['\u00d6', '='],
  ['\u00d7', '\u00d7'],
  ['\u00d8', '\u094d\u092f'],
  ['\u00d9', ';'],
  ['\u00da', '\u2019'],
  ['\u00db', '!'],
  ['\u00dc', '%'],
  ['\u00dd', '\u091f\u094d\u0920'],
  ['\u00df', '\u0926\u094d\u092e'],
  ['\u00e5', '\u0926\u094d\u0935'],
  ['\u00e6', '\u201c'],
  ['\u00e7', '\u0950'],
  ['\u00f7', '/'],
]

// Ordered regex transforms applied after character substitution. Each entry is
// [pattern, replacement]. Applied left-to-right; order matters (matra reordering
// before vowel merging, etc.). Patterns use the Devanagari Unicode property ranges.
const POST_RULES: readonly Pair[] = [
  ['\u094d\u093e', ''],
  ['(\u0924\u094d\u0930|\u0924\u094d\u0924)([^\u0909\u092d\u092a]+?)m', '\\1m\\2'],
  ['\u0924\u094d\u0930m', '\u0915\u094d\u0930'],
  ['\u0924\u094d\u0924m', '\u0915\u094d\u0924'],
  ['([^\u0909\u092d\u092a]+?)m', 'm\\1'],
  ['\u0909m', '\u090a'],
  ['\u092dm', '\u091d'],
  ['\u092am', '\u092b'],
  ['\u0907{', '\u0908'],
  ['\u093f((.\u094d)*[^\u094d])', '\\1\u093f'],
  [
    '(.[\u093e\u093f\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0902\u0903\u0901]*?){',
    '{\\1',
  ],
  ['((.\u094d)*){', '{\\1'],
  ['{', '\u0930\u094d'],
  [
    '([\u093e\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0902\u0903\u0901]+?)(\u094d(.\u094d)*[^\u094d])',
    '\\2\\1',
  ],
  [
    '\u094d([\u093e\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0902\u0903\u0901]+?)((.\u094d)*[^\u094d])',
    '\u094d\\2\\1',
  ],
  [
    '([\u0902\u0901])([\u093e\u093f\u0940\u0941\u0942\u0943\u0947\u0948\u094b\u094c\u0903]*)',
    '\\2\\1',
  ],
  ['\u0901\u0901', '\u0901'],
  ['\u0902\u0902', '\u0902'],
  ['\u0947\u0947', '\u0947'],
  ['\u0948\u0948', '\u0948'],
  ['\u0941\u0941', '\u0941'],
  ['\u0942\u0942', '\u0942'],
  ['^\u0903', ':'],
  ['\u091f\u0943', '\u091f\u094d\u091f'],
  ['\u0947\u093e', '\u093e\u0947'],
  ['\u0948\u093e', '\u093e\u0948'],
  ['\u0905\u093e\u0947', '\u0913'],
  ['\u0905\u093e\u0948', '\u0914'],
  ['\u0905\u093e', '\u0906'],
  ['\u090f\u0947', '\u0910'],
  ['\u093e\u0947', '\u094b'],
  ['\u093e\u0948', '\u094c'],
]

// Precompile: one alternation regex over all keys, longest-first, for O(n) replace.
const CHAR_LOOKUP = new Map<string, string>(CHARACTER_MAP)
const CHAR_KEYS = CHARACTER_MAP.map(([k]) => k)
  .filter((k) => k.length > 0)
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
const CHAR_RE = new RegExp(CHAR_KEYS.join('|'), 'g')

// POST_RULES replacements are authored in Python backreference syntax (\1, \2).
// JS String.replace with a string replacement needs $N instead, so convert here.
const toJsReplacement = (py: string) => py.replace(/\\(\d)/g, '$$$1')
const COMPILED_RULES = POST_RULES.map(([pat, rep]) => ({
  re: new RegExp(pat, 'g'),
  rep: toJsReplacement(rep),
}))

/**
 * Convert Preeti-encoded (Latin) text to Unicode Devanagari.
 * Two-pass: character substitution, then ordered regex rewrites. Unknown chars pass through.
 */
export function preetiToUnicode(input: string): string {
  if (!input) return ''
  let out = input.replace(CHAR_RE, (m) => CHAR_LOOKUP.get(m) ?? m)
  for (const { re, rep } of COMPILED_RULES) out = out.replace(re, rep)
  return out
}

// Reverse map for Unicode -> Preeti. The forward CHARACTER_MAP is many-to-one after
// POST_RULES merge vowels and conjuncts, so inverting it loses information. Instead we
// use this dedicated 72-entry dictionary (covering full Devanagari characters, matras,
// and the common clusters ज्ञ/र्/रू/ष्) plus a normalization pass that handles half-
// consonants (raising case: द् -> D) and the र् ligature marks (|, «, q). This matches
// the de-facto Nepali reverse-conversion algorithm and round-trips cleanly.
const UNICODE_TO_PREETI_MAP: readonly Pair[] = [
  ['अ', 'c'],
  ['आ', 'cf'],
  ['ा', 'f'],
  ['इ', 'O'],
  ['ई', 'O{'],
  ['र्', '{'],
  ['उ', 'p'],
  ['ए', 'P'],
  ['े', ']'],
  ['ै', '}'],
  ['ो', 'f]'],
  ['ौ', 'f}'],
  ['ओ', 'cf]'],
  ['औ', 'cf}'],
  ['ं', '+'],
  ['ँ', 'F'],
  ['ि', 'l'],
  ['ी', 'L'],
  ['ु', "'"],
  ['ू', '"'],
  ['क', 's'],
  ['ख', 'v'],
  ['ग', 'u'],
  ['घ', '3'],
  ['ङ', 'ª'],
  ['च', 'r'],
  ['छ', '5'],
  ['ज', 'h'],
  ['झ', '´'],
  ['ञ', '`'],
  ['ट', '6'],
  ['ठ', '7'],
  ['ड', '8'],
  ['ढ', '9'],
  ['ण', '0f'],
  ['त', 't'],
  ['थ', 'y'],
  ['द', 'b'],
  ['ध', 'w'],
  ['न', 'g'],
  ['प', 'k'],
  ['फ', 'km'],
  ['ब', 'a'],
  ['भ', 'e'],
  ['म', 'd'],
  ['य', 'o'],
  ['र', '/'],
  ['रू', '?'],
  ['ृ', '['],
  ['ल', 'n'],
  ['व', 'j'],
  ['स', ';'],
  ['श', 'z'],
  ['ष', 'if'],
  ['ज्ञ', '1'],
  ['ह', 'x'],
  ['१', '!'],
  ['२', '@'],
  ['३', '#'],
  ['४', '$'],
  ['५', '%'],
  ['६', '^'],
  ['७', '&'],
  ['८', '*'],
  ['९', '('],
  ['०', ')'],
  ['।', '.'],
  ['्', '\\'],
  ['ऊ', 'pm'],
  ['-', ' '],
  ['(', '-'],
  [')', '_'],
]
const U2P_LOOKUP = new Map<string, string>(UNICODE_TO_PREETI_MAP)

// Consonants whose Preeti key is a lowercase letter; a following ् (halant) that
// joins another consonant is written as the UPPERCASE key (the half-consonant form).
const HALF_CONSONANT_KEYS = new Set('wertyuxasdghjkzvn'.split(''))

/**
 * Normalize Devanagari for reverse conversion: collapse half-consonant clusters
 * (क् + X -> K + X) and resolve the र् ligature marks (क्र -> q / क|, ट्र -> «).
 * Ported from the canonical algorithm; operates index-by-index.
 */
function normalizeUnicodeForPreeti(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const ch = text[i]!
    const next = text[i + 1]
    const after = text[i + 2]
    try {
      if (
        ch !== 'र' &&
        next === '्' &&
        after !== undefined &&
        after !== ' ' &&
        after !== '।' &&
        after !== ','
      ) {
        if (after !== 'र') {
          const key = U2P_LOOKUP.get(ch)
          if (key && key.length === 1 && HALF_CONSONANT_KEYS.has(key)) {
            out += String.fromCharCode(key.charCodeAt(0) - 32)
            i += 2
            continue
          }
          if (ch === 'स') {
            out += ':'
            i += 2
            continue
          }
          if (ch === 'ष') {
            out += 'i'
            i += 2
            continue
          }
        }
      }
      const prev = text[i - 1]
      if (prev !== 'र' && ch === '्' && next === 'र') {
        if (prev !== 'ट' && prev !== 'ठ' && prev !== 'ड') {
          out += '|'
          i += 2
          continue
        }
        out += '«'
        i += 2
        continue
      }
    } catch {
      // fall through
    }
    out += ch
    i += 1
  }
  return out.replace(/त\|/g, 'q')
}

/**
 * Convert Unicode Devanagari to Preeti keystrokes. Uses the dedicated reverse
 * dictionary + normalize pass so common typed words round-trip cleanly through
 * preetiToUnicode. Clusters outside the dictionary pass through unchanged.
 *
 * Devanagari stores ि (U+093F, i-matra) AFTER its consonant, but the Preeti layout
 * types the i-matra key BEFORE the consonant. So we first walk the normalized string
 * and move each ि to precede the consonant it modifies, then map to Preeti keys.
 * This mirrors the forward POST_RULES that push ि back after the consonant.
 */
export function unicodeToPreeti(input: string): string {
  if (!input) return ''
  const normalized = normalizeUnicodeForPreeti(input)
  // Reorder ि (U+093F, i-matra) to sit BEFORE its consonant. Devanagari stores ि after
  // its consonant; the Preeti layout types the i-matra key first. If the consonant is
  // half-joined (consonant + ् + consonant), ि moves before the whole cluster.
  const reordered = normalized.replace(/((?:[क-ह]्)*[क-ह])ि/g, 'ि$1')
  let out = ''
  for (const ch of reordered) out += U2P_LOOKUP.get(ch) ?? ch
  return out
}

/** Normalize whitespace before converting (NBSP -> space, CRLF -> LF, trim ends). */
export function normalizeForConvert(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n?/g, '\n')
    .trim()
}
