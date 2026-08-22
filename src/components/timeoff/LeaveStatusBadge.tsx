import { Badge } from '@/components/ui/Badge'
import type { LeaveStatus } from '@/lib/mock-data'

const MAP: Record<LeaveStatus, { tone: 'warning' | 'success' | 'danger'; label: string }> = {
  pending: { tone: 'warning', label: 'Pending' },
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Rejected' },
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const m = MAP[status]
  return <Badge tone={m.tone}>{m.label}</Badge>
}
