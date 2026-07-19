import { JournalistQueueSkeleton } from '@/components/journalist/JournalistQueueSkeleton'

export default function JournalistAssignmentsLoading() {
  return <JournalistQueueSkeleton rows={6} label="Loading story queue" />
}
