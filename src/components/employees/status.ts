import type { AttendanceStatus } from '@/lib/mock-data'

export type DirectoryStatus = 'present' | 'leave' | 'absent'

export function statusFromRecord(status: AttendanceStatus | undefined, onApprovedLeaveToday: boolean): DirectoryStatus {
  if (onApprovedLeaveToday || status === 'leave') return 'leave'
  if (!status || status === 'absent') return 'absent'
  return 'present'
}
