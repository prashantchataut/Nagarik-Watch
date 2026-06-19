/**
 * Devanagari -> Latin slug transliteration + slug hygiene, producing stable, URL-safe
 * lowercase Latin slugs from Nepali headlines.
 *
 * Uses the proven `transliteration` package (MIT, zero-dep, browser-safe) rather than a
 * hand-rolled table. Devanagari uses matras (vowel signs) that attach to consonants and
 * conjunct clusters that simple character maps can't handle correctly; a purpose-built
 * library gets this right. (An earlier hand-rolled attempt failed on `ने` = `न` + `े`-matra.)
 *
 * Note: the library's romanization is approximate (e.g. `नेपाली` -> "nepaalii"), but for
 * URL slugs stability and uniqueness matter far more than phonetic precision. Slugs are
 * editor-overridable in the CMS, and uniqueness within a category is hook-enforced.
 */
import { slugify, transliterate } from 'transliteration'

/** Transliterate any (mixed Devanagari/Latin) string to Latin. Re-export of the lib. */
export { transliterate }

/** Produce a URL-safe lowercase Latin slug from any input. */
export function toSlug(input: string): string {
  return slugify(input, {
    lowercase: true,
    separator: '-',
    trim: true,
  })
    .replace(/-{2,}/g, '-') // collapse repeated separators the lib may emit
    .slice(0, 80) // bound length
}
