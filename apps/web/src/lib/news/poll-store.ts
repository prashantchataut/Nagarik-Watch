'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost } from './api-client'
import { getVoterKey } from './engagement'

/**
 * Poll of the day — real server-side counts (GET /api/poll), one vote per
 * person per poll (readers by account, everyone else by device key).
 */

export interface PollOptionWithVotes {
  id: string
  label: string
  votes: number
}

export interface LivePoll {
  id: string
  question: string
  options: PollOptionWithVotes[]
  totalVotes: number
  myVote: string | null
}

export function usePoll() {
  const [poll, setPoll] = useState<LivePoll | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const json = await apiGet<{ poll: LivePoll | null }>(`/api/poll?voterKey=${encodeURIComponent(getVoterKey())}`)
      setPoll(json.poll)
    } catch {
      setPoll(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const vote = useCallback(
    async (optionId: string): Promise<boolean> => {
      if (!poll || voting) return false
      setVoting(true)
      setError(null)
      try {
        const json = await apiPost<{ poll: LivePoll }>('/api/poll/vote', {
          pollId: poll.id,
          optionId,
          voterKey: getVoterKey(),
        })
        setPoll(json.poll)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'मत राख्न सकिएन।')
        return false
      } finally {
        setVoting(false)
      }
    },
    [poll, voting],
  )

  return { poll, loading, voting, error, vote, reload: load }
}
