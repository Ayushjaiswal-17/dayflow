import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { EmployeeStatusDot } from './EmployeeStatusDot'
import type { DirectoryStatus } from './EmployeeStatusDot'

export function EmployeeCard({
  id,
  name,
  avatarInitial,
  department,
  role,
  status,
}: {
  id: string
  name: string
  avatarInitial: string
  department: string
  role: string
  status: DirectoryStatus
}) {
  return (
    <Link
      to={`/employees/${id}`}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-surface-0 p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      <span className="absolute top-3 right-3">
        <EmployeeStatusDot status={status} />
      </span>
      <Avatar initials={avatarInitial} size="xl" className="mt-2 transition-transform group-hover:scale-[1.03]" />
      <div>
        <p className="text-sm font-bold text-ink-900">{name}</p>
        <p className="mt-0.5 text-xs text-ink-500">
          {department} · {role}
        </p>
      </div>
    </Link>
  )
}
