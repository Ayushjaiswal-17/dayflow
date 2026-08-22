import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Table, Td } from '@/components/ui/Table'
import { EmptyState } from '@/components/ui/Spinner'
import { useStore } from '@/lib/store-context'
import type { AttendanceRecord, AttendanceStatus, User } from '@/lib/mock-data'
import { monthName, shortDate, weekdayShort, cn } from '@/lib/utils'

const STATUS_TONE: Record<AttendanceStatus, { tone: 'success' | 'warning' | 'purple' | 'danger'; label: string }> = {
  present: { tone: 'success', label: 'Present' },
  half: { tone: 'warning', label: 'Half day' },
  leave: { tone: 'purple', label: 'On leave' },
  absent: { tone: 'danger', label: 'Absent' },
}

export function AttendancePage() {
  const { currentUser, isManagerRole } = useStore()
  return isManagerRole ? <AdminAttendanceView /> : <EmployeeAttendanceView userId={currentUser?.id ?? ''} />
}

function EmployeeAttendanceView({ userId }: { userId: string }) {
  const { attendance, users } = useStore()
  const [now] = useState(() => new Date())
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() })

  const user = users.find((u) => u.id === userId)

  const monthRecords = useMemo(
    () =>
      attendance
        .filter((r) => r.employeeId === userId && r.date.startsWith(`${ym.year}-${String(ym.month + 1).padStart(2, '0')}`))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [attendance, userId, ym],
  )

  const summary = useMemo(() => {
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysInMonth = new Date(ym.year, ym.month + 1, 0).getDate()
    const isCurrentMonth = ym.year === now.getFullYear() && ym.month === now.getMonth()

    let workingDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(ym.year, ym.month, d)
      const dow = date.getDay()
      if (dow === 0 || dow === 6) continue
      if (isCurrentMonth && date.getTime() > today.getTime()) continue
      workingDays++
    }
    const presentDays = monthRecords.filter((r) => r.status === 'present' || r.status === 'half').length
    const leaveDays = new Set(monthRecords.filter((r) => r.status === 'leave').map((r) => r.date)).size
    return { presentDays, leaveDays, workingDays }
  }, [monthRecords, ym])

  if (!user) return null

  const step = (delta: number) =>
    setYm(({ year, month }) => {
      const next = new Date(year, month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-extrabold text-ink-900">
          Attendance <span className="text-sm font-semibold text-ink-500">· {user.firstName} {user.lastName}</span>
        </h1>
        <nav aria-label="Month navigation" className="flex items-center gap-2">
          <button onClick={() => step(-1)} aria-label="Previous month" className="rounded-xl border border-ink-100 bg-surface-0 p-2 text-ink-500 transition-colors hover:border-blue-500 hover:text-blue-500 focus-ring">
            <ChevronLeft size={16} aria-hidden />
          </button>
          <label htmlFor="month-select" className="sr-only">Select month</label>
          <select
            id="month-select"
            value={`${ym.year}-${ym.month}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setYm({ year: y, month: m })
            }}
            className="rounded-xl border border-ink-100 bg-surface-0 px-3 py-2 text-sm font-bold text-ink-900 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {[1, 0].map((back) => {
              const d = new Date(now.getFullYear(), now.getMonth() - back, 1)
              const value = `${d.getFullYear()}-${d.getMonth()}`
              return (
                <option key={value} value={value}>
                  {monthName(d.getMonth())} {d.getFullYear()}
                </option>
              )
            })}
          </select>
          <button onClick={() => step(1)} aria-label="Next month" className="rounded-xl border border-ink-100 bg-surface-0 p-2 text-ink-500 transition-colors hover:border-blue-500 hover:text-blue-500 focus-ring">
            <ChevronRight size={16} aria-hidden />
          </button>
        </nav>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          ['Days Present', summary.presentDays, 'bg-blue-50 text-blue-700'],
          ['Leaves', summary.leaveDays, 'bg-purple-50 text-purple-600'],
          ['Working Days', summary.workingDays, 'bg-pink-50 text-pink-400'],
        ].map(([label, value, chip]) => (
          <Card key={String(label)} className="p-4">
            <dt className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${chip}`}>{label}</dt>
            <dd className="mt-2 text-2xl font-extrabold text-ink-900">{value}</dd>
          </Card>
        ))}
      </dl>

      <Card className="p-5">
        {monthRecords.length === 0 ? (
          <EmptyState icon={<ChevronRight size={22} aria-hidden />} title="No attendance records yet" subtitle={`Nothing recorded in ${monthName(ym.month)} ${ym.year}.`} />
        ) : (
          <Table headers={['Date', 'Check In', 'Check Out', 'Work Hours', 'Extra Hours', 'Status']} caption={`Day-wise attendance for ${monthName(ym.month)} ${ym.year}`}>
            {monthRecords.map((r) => (
              <tr key={r.date} className={cn('transition-colors hover:bg-cream/50')}>
                <Td>
                  <span className="font-bold text-ink-900">{shortDate(r.date)}</span>{' '}
                  <span className="text-xs text-ink-500">{weekdayShort(r.date)}</span>
                </Td>
                <Td>{r.checkIn ?? '—'}</Td>
                <Td>{r.checkOut ?? '—'}</Td>
                <Td>{r.workHours > 0 ? `${r.workHours} hrs` : '—'}</Td>
                <Td>{r.extraHours > 0 ? `+${r.extraHours} hrs` : '—'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[r.status].tone}>{STATUS_TONE[r.status].label}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}

function AdminAttendanceView() {
  const { users, attendance, todayISO } = useStore()
  const [date, setDate] = useState(todayISO)
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return attendance
      .filter((r) => r.date === date)
      .map((rec) => {
        const user = users.find((u) => u.id === rec.employeeId)
        return user ? ({ rec, user } as { rec: AttendanceRecord; user: User }) : null
      })
      .filter((row): row is { rec: AttendanceRecord; user: User } => row !== null)
      .filter(({ user }) => !needle || `${user.firstName} ${user.lastName}`.toLowerCase().includes(needle))
      .sort((a, b) => a.user.firstName.localeCompare(b.user.firstName))
  }, [attendance, users, date, q])

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold text-ink-900">
        Team Attendance <span className="text-sm font-semibold text-ink-500">· all employees</span>
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div role="search" className="relative sm:w-72">
          <Search size={16} aria-hidden className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employee…"
            aria-label="Search employees by name"
            className="w-full rounded-xl border border-ink-100 bg-surface-0 py-2.5 pr-4 pl-10 text-sm placeholder:text-ink-300 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>
        <label htmlFor="att-date" className="sr-only">Pick a day</label>
        <input
          id="att-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-ink-100 bg-surface-0 px-3.5 py-2.5 text-sm font-bold text-ink-900 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:ml-auto"
        />
      </div>

      <Card className="p-5">
        {rows.length === 0 ? (
          <EmptyState icon={<Search size={22} aria-hidden />} title="No records for this day" subtitle="Try another date — weekends and future days have no attendance yet." />
        ) : (
          <Table headers={['Emp', 'Check In', 'Check Out', 'Work Hours', 'Extra Hours', 'Status']} caption={`Attendance for the selected day`}>
            {rows.map(({ rec, user }) => (
              <tr key={`${rec.employeeId}-${rec.date}`} className="transition-colors hover:bg-cream/50">
                <Td>
                  <span className="font-bold text-ink-900">{user.firstName} {user.lastName}</span>
                  <span className="block text-xs text-ink-500">{user.department}</span>
                </Td>
                <Td>{rec.checkIn ?? '—'}</Td>
                <Td>{rec.checkOut ?? '—'}</Td>
                <Td>{rec.workHours > 0 ? `${rec.workHours} hrs` : '—'}</Td>
                <Td>{rec.extraHours > 0 ? `+${rec.extraHours} hrs` : '—'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[rec.status].tone}>{STATUS_TONE[rec.status].label}</Badge>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  )
}
