import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Search, UserSearch } from 'lucide-react'
import { EmployeeCard } from '@/components/employees/EmployeeCard'
import { statusFromRecord } from '@/components/employees/EmployeeStatusDot'
import { CheckInOutWidget, NewEmployeeModal } from '@/components/employees/NewEmployeeModal'
import { EmptyState } from '@/components/ui/Spinner'
import { useStore } from '@/lib/store'
import type { LeaveRequest } from '@/lib/mock-data'

export function EmployeesPage() {
  const { currentUser, users, recordFor, todayISO, leaves } = useStore()
  const [params, setParams] = useSearchParams()
  const [newModal, setNewModal] = useState(false)

  const q = (params.get('q') ?? '').trim()
  const setQuery = (value: string) => {
    if (value) params.set('q', value)
    else params.delete('q')
    setParams(params, { replace: true })
  }

  const isManager = currentUser?.role === 'admin' || currentUser?.role === 'hr'

  const onLeaveToday = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const lv of leaves as LeaveRequest[]) {
      if (lv.status === 'approved' && todayISO >= lv.startDate && todayISO <= lv.endDate) map.set(lv.employeeId, true)
    }
    return map
  }, [leaves, todayISO])

  const visibleUsers = useMemo(() => {
    const needle = q.toLowerCase()
    return users
      .filter((u) => !needle || `${u.firstName} ${u.lastName} ${u.department}`.toLowerCase().includes(needle))
      .map((u) => ({
        user: u,
        status: statusFromRecord(recordFor(u.id, todayISO)?.status, onLeaveToday.get(u.id) === true),
      }))
  }, [users, q, recordFor, todayISO, onLeaveToday])

  return (
    <div className="space-y-5 pb-40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <h1 className="text-xl font-extrabold text-ink-900">
          Employees <span className="text-sm font-semibold text-ink-500">({visibleUsers.length})</span>
        </h1>
        {isManager && (
          <button
            onClick={() => setNewModal(true)}
            className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden /> NEW
          </button>
        )}
        <div role="search" className="sm:ml-auto sm:w-72">
          <div className="relative">
            <Search size={16} aria-hidden className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-300" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or department…"
              aria-label="Search employees"
              className="w-full rounded-xl border border-ink-100 bg-surface-0 py-2.5 pr-4 pl-10 text-sm text-ink-900 placeholder:text-ink-300 transition-colors hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-500" aria-label="Status legend">
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-success-500" /> In office</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-50 text-[11px] text-purple-600">✈</span> On leave</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-warning-500" /> Absent</li>
      </ul>

      {visibleUsers.length === 0 ? (
        <EmptyState icon={<UserSearch size={22} aria-hidden />} title="No employees found" subtitle={`Nothing matches “${q}”. Try a different name.`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleUsers.map(({ user, status }) => (
            <EmployeeCard
              key={user.id}
              id={user.id}
              name={`${user.firstName} ${user.lastName}`}
              avatarInitial={user.avatarInitial}
              department={user.department}
              role={user.role === 'admin' ? 'Admin' : user.role === 'hr' ? 'HR Officer' : 'Employee'}
              status={status}
            />
          ))}
        </div>
      )}

      <CheckInOutWidget />
      {isManager && <NewEmployeeModal open={newModal} onClose={() => setNewModal(false)} />}
    </div>
  )
}
