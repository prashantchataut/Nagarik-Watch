import { AdminShell } from '@/components/admin/AdminShell'
import { PollsManager } from '@/components/admin/PollsManager'

export default function Page() {
  return (
    <AdminShell active="Polls">
      <PollsManager />
    </AdminShell>
  )
}
