import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, Palmtree, Plus, Search, Stethoscope, Sun } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, Td } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/Spinner'
import { LeaveCalendar } from '@/components/timeoff/LeaveCalendar'
import { LeaveRequestModal } from '@/components/timeoff/LeaveRequestModal'
import { LeaveStatusBadge } from '@/components/timeoff/LeaveStatusBadge'
import { useToast } from '@/lib/toast-context'
import { useStore } from '@/lib/store-context'
import { computeLeaveBalance } from '@/lib/mock-data'
import { shortDate } from '@/lib/utils'

const TYPE_LABEL = {
  paid: 'Paid time off',
  sick: 'Sick leave',
  unpaid: 'Unpaid leave',
} as const

export function TimeOffPage() {
  const { currentUser, isManagerRole } = useStore()
  return isManagerRole ? <ManagerTimeOffView /> : <EmployeeTimeOffView userId={currentUser?.id ?? ''} />
}

function AvailabilityCard({
  tone,
  icon,
  title,
  days,
}: {
  tone: 'purple' | 'pink'
  icon: React.ReactNode
  title: string
  days: number
}) {
  const chip = tone === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-400'
  const border = tone === 'purple' ? 'border-t-purple-500' : 'border-t-pink-400'
  return (
    <Card className={`p-5 ${border}`}>
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden className={`flex h-9 w-9 items-center justify-center rounded-lg ${chip}`}>{icon}</span>
        <h3 className="text-sm font-bold text-ink-700">{title}</h3>
      </div>
      <p className="text-2xl font-extrabold text-ink-900">
        {String(days).padStart(2, '0')} Days <span className="text-sm font-semibold text-ink-500">available</span>
      </p>
    </Card>
  )
}

function EmployeeTimeOffView({ userId }: { userId: string }) {
  const { leaves, currentUser } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  if (!currentUser) return null

  const myLeaves = leaves.filter((l) => l.employeeId === userId)
  const balance = computeLeaveBalance(userId, leaves)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="app-page-title text-ink-900">Time Off</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} aria-hidden /> NEW
        </Button>
      </div>

      <section aria-label="Availability" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AvailabilityCard tone="purple" icon={<Palmtree size={18} aria-hidden />} title="Paid Time Off" days={balance.paid} />
        <AvailabilityCard tone="pink" icon={<Stethoscope size={18} aria-hidden />} title="Sick Time Off" days={balance.sick} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <CardTitle>My Requests</CardTitle>
          <div className="mt-3">
            {myLeaves.length === 0 ? (
              <EmptyState icon={<Sun size={22} aria-hidden />} title="No requests yet" subtitle="Hit NEW to plan your next break." />
            ) : (
              <Table headers={['Type', 'Start', 'End', 'Days', 'Status']} caption="Your time-off requests">
                {myLeaves.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-cream/50">
                    <Td>{TYPE_LABEL[l.type]}</Td>
                    <Td>{shortDate(l.startDate)}</Td>
                    <Td>{shortDate(l.endDate)}</Td>
                    <Td>{l.days}</Td>
                    <Td>
                      <LeaveStatusBadge status={l.status} />
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3 flex items-center gap-2">
            <CalendarDays size={15} aria-hidden /> Calendar
          </CardTitle>
          <LeaveCalendar leaves={myLeaves} />
        </Card>
      </div>

      <LeaveRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function ManagerTimeOffView() {
  const { leaves, setLeaveStatus } = useStore()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)

  const q = (params.get('q') ?? '').trim()

  const rows = useMemo(() => {
    const needle = q.toLowerCase()
    const rank = { pending: 0, approved: 1, rejected: 2 } as const
    return leaves
      .filter((l) => !needle || l.employeeName.toLowerCase().includes(needle))
      .sort((a, b) => rank[a.status] - rank[b.status] || b.startDate.localeCompare(a.startDate))
  }, [leaves, q])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="app-page-title text-ink-900">Time Off Requests</h1>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} aria-hidden /> NEW
        </Button>
      </div>

      <div role="search" className="relative sm:max-w-xs">
        <Search size={16} aria-hidden className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            if (e.target.value) params.set('q', e.target.value)
            else params.delete('q')
            setParams(params, { replace: true })
          }}
          placeholder="Filter by employee name…"
          aria-label="Filter requests by employee"
          className="w-full rounded-xl border border-ink-100 bg-surface-0 py-2.5 pr-4 pl-10 text-sm placeholder:text-ink-300 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      <Card className="p-5">
        {rows.length === 0 ? (
          <EmptyState icon={<Search size={22} aria-hidden />} title="No requests found" subtitle="Nothing matches this filter." />
        ) : (
          <Table headers={['Name', 'Start Date', 'End Date', 'Time off Type', 'Status', 'Actions']} caption="All employee time-off requests">
            {rows.map((l) => (
              <tr key={l.id} className="transition-colors hover:bg-cream/50">
                <Td>
                  <span className="font-bold text-ink-900">{l.employeeName}</span>
                  {l.attachment && <span className="ml-2 text-[10px] font-bold tracking-wide text-blue-500 uppercase">📎 doc</span>}
                </Td>
                <Td>{shortDate(l.startDate)}</Td>
                <Td>{shortDate(l.endDate)}</Td>
                <Td>
                  {TYPE_LABEL[l.type]} · {l.days}d
                </Td>
                <Td>
                  <LeaveStatusBadge status={l.status} />
                </Td>
                <Td>
                  {l.status === 'pending' ? (
                    <span className="flex gap-2">
                      <Button variant="success" className="px-3 py-1.5 text-xs" onClick={() => { setLeaveStatus(l.id, 'approved'); toast(`${l.employeeName}'s leave approved`) }}>
                        Approve
                      </Button>
                      <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => { setLeaveStatus(l.id, 'rejected'); toast(`${l.employeeName}'s leave rejected`, 'info') }}>
                        Reject
                      </Button>
                    </span>
                  ) : (
                    <span className="text-xs text-ink-300">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <LeaveRequestModal open={modalOpen} onClose={() => setModalOpen(false)} allowEmployeePick />
    </div>
  )
}
