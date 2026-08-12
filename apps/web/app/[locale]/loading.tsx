import { JournalistQueueSkeleton } from '@/components/journalist/JournalistQueueSkeleton'

export default function JournalistDashboardLoading() {
  return <JournalistQueueSkeleton rows={4} label="Loading desk" />
}
