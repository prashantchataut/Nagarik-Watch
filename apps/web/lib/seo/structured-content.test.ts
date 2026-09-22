import type { ArticleBlock } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import { extractFaqPairs, extractHowTo, stripInline } from './structured-content'

const para = (text: string): ArticleBlock => ({ type: 'paragraph', text })
const h2 = (text: string): ArticleBlock => ({ type: 'heading2', text })
const list = (items: string[], ordered = true): ArticleBlock => ({ type: 'list', ordered, items })

const LONG = 'मतदाता नामावलीमा नाम दर्ता गर्न निर्वाचन आयोगको कार्यालयमा जानुपर्छ भन्ने हो।'

describe('stripInline', () => {
  it('removes the body format shorthand', () => {
    expect(stripInline('**जरुरी** *कुरा* ==यो== [स्रोत](https://ec.gov.np)')).toBe(
      'जरुरी कुरा यो स्रोत',
    )
  })
})

describe('extractFaqPairs', () => {
  it('pairs question subheads with the prose under them', () => {
    const pairs = extractFaqPairs([
      para('परिचय अनुच्छेद।'),
      h2('मतदाता परिचयपत्र कसरी लिने?'),
      para(LONG),
      h2('कति समय लाग्छ?'),
      para(LONG),
    ])
    expect(pairs).toHaveLength(2)
    expect(pairs[0]?.question).toBe('मतदाता परिचयपत्र कसरी लिने?')
    expect(pairs[0]?.answer).toContain('निर्वाचन आयोग')
  })

  it('emits nothing for an ordinary news body', () => {
    // No question marks in the subheads — the common case, and it must stay silent.
    expect(extractFaqPairs([h2('पृष्ठभूमि'), para(LONG), h2('प्रतिक्रिया'), para(LONG)])).toEqual(
      [],
    )
  })

  it('needs two pairs before it is a FAQ', () => {
    expect(extractFaqPairs([h2('यो के हो?'), para(LONG)])).toEqual([])
  })

  it('skips a question whose section has no real answer', () => {
    expect(
      extractFaqPairs([
        h2('यो के हो?'),
        para('हो।'),
        h2('कहिले?'),
        para(LONG),
        h2('कहाँ?'),
        para(LONG),
      ]),
    ).toHaveLength(2)
  })

  it('counts list items as answer text', () => {
    const pairs = extractFaqPairs([
      h2('के कागजात चाहिन्छ?'),
      list(['नागरिकताको प्रमाणपत्र', 'दुई प्रति फोटो', 'बसाइँसराइको सिफारिस'], false),
      h2('कति शुल्क लाग्छ?'),
      para(LONG),
    ])
    expect(pairs).toHaveLength(2)
    expect(pairs[0]?.answer).toContain('नागरिकताको प्रमाणपत्र')
  })

  it('truncates a runaway answer at a word boundary', () => {
    const pairs = extractFaqPairs([
      h2('यो के हो?'),
      para('शब्द '.repeat(400)),
      h2('अर्को के?'),
      para(LONG),
    ])
    expect(pairs[0]?.answer.length).toBeLessThanOrEqual(1001)
    expect(pairs[0]?.answer.endsWith('…')).toBe(true)
  })

  it('handles an empty or missing body', () => {
    expect(extractFaqPairs([])).toEqual([])
    expect(extractFaqPairs(undefined)).toEqual([])
  })
})

describe('extractHowTo', () => {
  it('reads steps from an ordered list under a procedure heading', () => {
    const howTo = extractHowTo([
      para('प्रस्तावना।'),
      h2('निवेदन कसरी दिने?'),
      list(['फारम भर्नुहोस्', 'कागजात संलग्न गर्नुहोस्', 'बुझाउनुहोस्']),
    ])
    expect(howTo?.name).toBe('निवेदन कसरी दिने')
    expect(howTo?.steps).toEqual(['फारम भर्नुहोस्', 'कागजात संलग्न गर्नुहोस्', 'बुझाउनुहोस्'])
  })

  it('needs both signals, not either one', () => {
    // An ordered list with no procedure heading is just a numbered list.
    expect(extractHowTo([h2('मुख्य बुँदा'), list(['एक', 'दुई', 'तीन'])])).toBeNull()
    // A procedure heading over prose is just a headline.
    expect(extractHowTo([h2('कसरी दर्ता गर्ने?'), para(LONG)])).toBeNull()
    // An unordered list is a list of things, not a sequence of steps.
    expect(extractHowTo([h2('कसरी दर्ता गर्ने?'), list(['एक', 'दुई'], false)])).toBeNull()
  })

  it('matches English procedure headings too', () => {
    expect(
      extractHowTo([h2('How to file a complaint'), list(['Visit the office', 'Submit the form'])])
        ?.steps,
    ).toHaveLength(2)
  })

  it('rejects a one-step procedure', () => {
    expect(extractHowTo([h2('कसरी गर्ने?'), list(['एक मात्र'])])).toBeNull()
  })
})
