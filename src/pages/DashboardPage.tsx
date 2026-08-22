import { useMemo, useState } from 'react'
import { CalendarDays, Clock, Palmtree, UserRound, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { GreetingBanner, StatCard } from '@/components/dashboard/GreetingBanner'
import { LeaveCTA } from '@/components/dashboard/LeaveCTA'
import { WeeklyAttendanceChart } from '@/components/dashboard/WeeklyAttendanceChart'
import type { WeekPoint } from '@/components/dashboard/WeeklyAttendanceChart'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickAccessCard } from '@/components/dashboard/QuickAccessCard'
import { LeaveRequestModal } from '@/components/timeoff/LeaveRequestModal'
import { useStore } from '@/lib/store-context'
import {
  addMinutesToTime12,
  computeLeaveBalance,
  toISO,
} from '@/lib/mock-data'
import { currencyINR, dateMessage, greetingForHour } from '@/lib/utils'

export function DashboardPage() {
  const { currentUser, attendance, leaves, activities, recordFor } = useStore()
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)

  const weekPoints: WeekPoint[] = useMemo(() => {
    if (!currentUser) return []
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return labels.map((day, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const iso = toISO(d)
      const rec = attendance.find((r) => r.employeeId === currentUser.id && r.date === iso)
      if (!rec || rec.status === 'absent' || rec.status === 'leave') return { day, hours: 0, status: 'absent' }
      return {
        day,
        hours: rec.workHours,
        status: rec.status === 'half' ? 'half' : 'full',
      }
    })
  }, [attendance, currentUser])

  if (!currentUser) return null

  const todayISO = toISO(new Date())
  const todayRecord = recordFor(currentUser.id, todayISO)
  const balance = computeLeaveBalance(currentUser.id, leaves)
  const greeting = greetingForHour(new Date().getHours())

  return (
    <div className="space-y-6">
      <GreetingBanner
        firstName={currentUser.firstName}
        checkedInAt={todayRecord?.checkIn ?? null}
        dateMessage={dateMessage(new Date())}
        emoji={greeting.emoji}
      />

      {/* Three-column stat cards */}
      <section aria-label="Your stats" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard accent="blue" icon={<Clock size={18} aria-hidden />} title="Today's Attendance">
          <p className="text-2xl font-extrabold tracking-tight text-ink-900">
            {todayRecord?.checkIn ?? '--:--'}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            {todayRecord?.checkIn
              ? `Check-out ETA ${addMinutesToTime12(todayRecord.checkIn, 9 * 60)}`
              : 'Use the Check In widget on the Employees page'}
          </p>
        </StatCard>

        <StatCard accent="purple" icon={<Palmtree size={18} aria-hidden />} title="Leave Balance">
          <p className="text-2xl font-extrabold tracking-tight text-ink-900">{balance.total} Days</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="blue">Paid · {balance.paid}</Badge>
            <Badge tone="purple">Sick · {balance.sick}</Badge>
            <Badge tone="neutral">Unpaid · {balance.unpaid}</Badge>
          </div>
        </StatCard>

        <StatCard accent="pink" icon={<Wallet size={18} aria-hidden />} title="This Month's Salary">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-extrabold tracking-tight text-ink-900">
              {currencyINR(currentUser.salaryConfig.monthlyWage)}
            </p>
            <Badge tone="success">Payslip ready</Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink-500">
            Net credited on the 1st of next month
          </p>
        </StatCard>
      </section>

      <LeaveCTA onApply={() => setLeaveModalOpen(true)} />

      {/* Chart + activity */}
      <section aria-label="Attendance and activity" className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold text-ink-900">This Week&apos;s Attendance</h2>
          <WeeklyAttendanceChart data={weekPoints} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 text-base font-bold text-ink-900">Recent Activity</h2>
          <ActivityFeed activities={activities} />
        </Card>
      </section>

      {/* Quick access */}
      <h2 className="mt-8 mb-4 text-lg font-extrabold text-ink-900">Quick Access</h2>
      <section aria-label="Quick access" className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <QuickAccessCard
          title="My Profile"
          cta="View Profile"
          to="/profile"
          tone="blue"
          illustration={<UserRound className="text-blue-500" aria-hidden />}
        />
        <QuickAccessCard
          title="Attendance History"
          cta="View History"
          to="/attendance"
          tone="purple"
          illustration={<CalendarDays className="text-purple-500" aria-hidden />}
        />
      </section>

      <LeaveRequestModal open={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} />
    </div>
  )
}
