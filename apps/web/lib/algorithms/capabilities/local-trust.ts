import type { CapabilitySpec } from '../types'
import { num, str, okLocal } from '../handlers/utils'
import { sourceReliabilityScore, factConsistencyScore, misinformationPatternScore } from '../product/editorial-scorers'
import { botScore } from '../product/traffic-quality'
import { surfaceFor } from './surface'

export const LOCAL_TRUST_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'source-reliability-score',
    surface: surfaceFor('source-reliability-score'),
    mode: 'local',
    run: (input) => {
      const correctionsIssued = num(input, 'correctionsIssued', 2)
      const storiesPublished = num(input, 'storiesPublished', 240)
      const yearsActive = num(input, 'yearsActive', 6)
      const score = sourceReliabilityScore({ correctionsIssued, storiesPublished, yearsActive })
      return okLocal(`sourceReliability=${score.toFixed(3)} corrections=${correctionsIssued}/${storiesPublished}`, {
        score,
      })
    },
  },
  {
    id: 'fact-consistency-check',
    surface: surfaceFor('fact-consistency-check'),
    mode: 'local',
    run: (input) => {
      const claims = num(input, 'claims', 5)
      const citations = num(input, 'citations', 3)
      const score = factConsistencyScore(claims, citations)
      return okLocal(`factConsistency=${score.toFixed(3)} claims=${claims} corroborated=${citations}`, { score })
    },
  },
  {
    id: 'misinformation-pattern-detection',
    surface: surfaceFor('misinformation-pattern-detection'),
    mode: 'local',
    run: (input) => {
      const text = str(input, 'text', 'सामान्य समाचार सामग्री')
      const { score, matches } = misinformationPatternScore(text)
      return okLocal(`misinfoPatternScore=${score.toFixed(3)} matches=${matches}`, { score })
    },
  },
  {
    id: 'bot-traffic-detection',
    surface: surfaceFor('bot-traffic-detection'),
    mode: 'local',
    run: (input) => {
      const score = botScore({
        requestsPerMinute: num(input, 'requestsPerMinute', 6),
        jsExecuted: Boolean(input.jsExecuted ?? true),
        mouseMovements: num(input, 'mouseMovements', 24),
        headlessUserAgent: Boolean(input.headlessUserAgent),
        knownDatacenterIp: Boolean(input.knownDatacenterIp),
        sessionDurationSeconds: num(input, 'sessionDurationSeconds', 95),
        pagesPerSession: num(input, 'pagesPerSession', 3),
      })
      return okLocal(`botScore=${score.toFixed(3)}`, { score })
    },
  },
]
