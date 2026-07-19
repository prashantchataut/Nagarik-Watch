import type { CapabilitySpec } from '../types'
import { num, okLocal, fail } from '../handlers/utils'
import { bestSendHour, sendTimeScore } from '../product/notify-policy'
import { surfaceFor } from './surface'

export const LOCAL_NOTIFICATIONS_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'send-time-optimization',
    surface: surfaceFor('send-time-optimization'),
    mode: 'local',
    run: (input) => {
      const engagementByHour = (input.engagementByHour as number[]) ?? []
      const hour = num(input, 'hour', 9)
      if (engagementByHour.length !== 24) {
        return fail('local', 'engagementByHour must have 24 hourly buckets', {
          detail: `got ${engagementByHour.length} hourly buckets`,
        })
      }
      const best = bestSendHour(engagementByHour)
      const score = sendTimeScore(hour, engagementByHour)
      return okLocal(`bestHour=${best} requestedHourScore=${score.toFixed(3)}`, {
        score,
        outputs: { bestHour: best },
      })
    },
  },
]
