import { describe, expect, it } from 'vitest'
import { normalizeForConvert, preetiToUnicode, unicodeToPreeti } from './preeti'

/**
 * Every pair below was produced by an independent reference converter (npttf2utf,
 * the de-facto Nepali ASCII-font toolchain) and round-trips cleanly there. They are
 * the ground truth this port must match — a diff means the port drifted, not the data.
 */
const CORPUS: ReadonlyArray<{ preeti: string; unicode: string }> = [
  { preeti: 'gd:t]', unicode: 'नमस्ते' },
  { preeti: 'g]kfn', unicode: 'नेपाल' },
  { preeti: 'sf7df8f}+', unicode: 'काठमाडौं' },
  { preeti: 'ljb\\ofno', unicode: 'विद्यालय' },
  { preeti: ';/sf/', unicode: 'सरकार' },
  { preeti: '/fhgLlt', unicode: 'राजनीति' },
  { preeti: ':jfut', unicode: 'स्वागत' },
  { preeti: 'gful/s jfr', unicode: 'नागरिक वाच' },
  { preeti: ';dfrf/', unicode: 'समाचार' },
  { preeti: 'kqsf/', unicode: 'पत्रकार' },
  { preeti: 'hgtf', unicode: 'जनता' },
  { preeti: 'k|hftGq', unicode: 'प्रजातन्त्र' },
  { preeti: ';+ljwfg', unicode: 'संविधान' },
  { preeti: 'clwsf/', unicode: 'अधिकार' },
  { preeti: 'b]z', unicode: 'देश' },
  { preeti: ';+;b', unicode: 'संसद' },
  { preeti: "d'n's", unicode: 'मुलुक' },
  { preeti: 'gful/s', unicode: 'नागरिक' },
  { preeti: 'lzIff', unicode: 'शिक्षा' },
  { preeti: ':jf:Yo', unicode: 'स्वास्थ्य' },
  { preeti: 'cy{tGq', unicode: 'अर्थतन्त्र' },
  { preeti: 'k|wfgdGqL', unicode: 'प्रधानमन्त्री' },
  { preeti: '/fi6«klt', unicode: 'राष्ट्रपति' },
  { preeti: 'pk/fi6«klt', unicode: 'उपराष्ट्रपति' },
  { preeti: ';+3Lo', unicode: 'संघीय' },
  { preeti: 'k|b]z', unicode: 'प्रदेश' },
  { preeti: 'lhNnf', unicode: 'जिल्ला' },
  { preeti: 'ufpFkflnsf', unicode: 'गाउँपालिका' },
]

describe('preetiToUnicode', () => {
  it('matches the README reference example "asdfghjk" -> बकमानजवप', () => {
    expect(preetiToUnicode('asdfghjk')).toBe('बकमानजवप')
  })

  it.each(CORPUS)('converts preeti "$preeti" -> "$unicode"', ({ preeti, unicode }) => {
    expect(preetiToUnicode(preeti)).toBe(unicode)
  })

  it('returns empty for empty input', () => {
    expect(preetiToUnicode('')).toBe('')
  })
})

describe('unicodeToPreeti', () => {
  it('matches the README reference example "सबिन आचार्य" -> ;lag cfrf/\\o', () => {
    expect(unicodeToPreeti('सबिन आचार्य')).toBe(';lag cfrf/\\o')
  })

  it.each(CORPUS)('round-trips "$unicode" through preeti back to unicode', ({ unicode }) => {
    const preeti = unicodeToPreeti(unicode)
    expect(preetiToUnicode(preeti)).toBe(unicode)
  })

  it('returns empty for empty input', () => {
    expect(unicodeToPreeti('')).toBe('')
  })
})

describe('normalizeForConvert', () => {
  it('trims and converts NBSP and CRLF', () => {
    expect(normalizeForConvert('  हैलो\u00a0\r\n  ')).toBe('हैलो')
  })
})
