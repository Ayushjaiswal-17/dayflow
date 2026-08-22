import { Plane } from 'lucide-react'
import type { DirectoryStatus } from './status'

export function EmployeeStatusDot({ status }: { status: DirectoryStatus }) {
  if (status === 'leave') {
    return (
      <span title="On leave" aria-label="On leave" className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-purple-600">
        <Plane size={13} aria-hidden />
      </span>
    )
  }
  if (status === 'present') {
    return (
      <span title="In office" aria-label="Present in office" className="block h-3 w-3 rounded-full bg-success-500 ring-2 ring-success-50" />
    )
  }
  return (
    <span title="Absent" aria-label="Absent" className="block h-3 w-3 rounded-full bg-warning-500 ring-2 ring-warning-50" />
  )
}
