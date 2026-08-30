/**
 * NEPSE snapshot — demo market data for the market well and /#nepse page.
 * Static snapshot labelled "बन्द भाव" (closing figures); clearly marked as a
 * delayed demo feed on the page so readers never mistake it for live trading.
 */

export interface NepseStock {
  symbol: string
  nameNe: string
  ltp: number
  changePct: number
}

export const nepseSnapshot = {
  asOfNe: 'गत दिनको बन्द भाव · डेमो स्न्यापसट',
  asOfEn: 'Previous close · demo snapshot',
  index: {
    value: 2145.32,
    changeAbs: 18.06,
    changePct: 0.85,
  },
  sensitive: {
    value: 386.41,
    changeAbs: 3.12,
    changePct: 0.81,
  },
  float: {
    value: 156.28,
    changeAbs: 1.04,
    changePct: 0.67,
  },
  turnover: 'रु ९८.७६ करोड',
  turnoverEn: 'Rs 9.876 billion',
  advancing: 118,
  declining: 74,
  unchanged: 31,
}

export const nepseMovers: NepseStock[] = [
  { symbol: 'NABIL', nameNe: 'नबिल बैंक', ltp: 512.0, changePct: 2.98 },
  { symbol: 'NICA', nameNe: 'निकासिया बैंक', ltp: 421.0, changePct: 2.44 },
  { symbol: 'HDL', nameNe: 'हिमालयन डिस्टिलरी', ltp: 1322.0, changePct: 1.98 },
  { symbol: 'NTC', nameNe: 'नेपाल टेलिकम', ltp: 858.0, changePct: 1.42 },
  { symbol: 'ADBL', nameNe: 'कृषि विकास बैंक', ltp: 402.0, changePct: 1.21 },
  { symbol: 'SHL', nameNe: 'सोल्टी होटल', ltp: 248.0, changePct: -2.73 },
  { symbol: 'SBL', nameNe: 'सनबिम बैंक', ltp: 296.0, changePct: -1.99 },
  { symbol: 'UNL', nameNe: 'उनिलिभर नेपाल', ltp: 39800.0, changePct: -1.48 },
  { symbol: 'JBBL', nameNe: 'जनता बिजुली', ltp: 372.0, changePct: -1.07 },
  { symbol: 'CHCL', nameNe: 'चिलिमे जडित', ltp: 505.0, changePct: -0.78 },
]

export const nepseSectors = [
  { nameNe: 'बैंक तथा वित्त', value: 412.5, changePct: 1.12 },
  { nameNe: 'जलविद्युत्', value: 388.9, changePct: -0.42 },
  { nameNe: 'जीवन बीमा', value: 902.3, changePct: 0.61 },
  { nameNe: 'उत्पादन', value: 271.7, changePct: 0.18 },
  { nameNe: 'व्यापार', value: 214.2, changePct: -0.94 },
  { nameNe: 'होटल तथा पर्यटन', value: 198.4, changePct: 0.55 },
  { nameNe: 'अन्य', value: 761.8, changePct: 0.34 },
]

/** Indices for the sparkline in the masthead + market well (last 12 sessions). */
export const nepseSparkline = [
  2098, 2102, 2096, 2108, 2115, 2110, 2118, 2126, 2121, 2131, 2127, 2145,
]
