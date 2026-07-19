import { JournalistQueueSkeleton } from '@/components/journalist/JournalistQueueSkeleton'

export default function JournalistFeedbackLoading() {
  return <JournalistQueueSkeleton rows={3} label="Loading feedback" />
}
