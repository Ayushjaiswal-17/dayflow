import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from '@/lib/tokens'
import { cn } from '@/lib/utils'

export type WeekStatus = 'full' | 'half' | 'absent'

export interface WeekPoint {
  day: string
  hours: number
  status: WeekStatus
}

const FILL: Record<WeekStatus, string> = {
  full: CHART_COLORS.blue500,
  half: CHART_COLORS.purple300,
  absent: CHART_COLORS.pink300,
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: WeekPoint }>; label?: string }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-ink-100 bg-surface-0 px-3 py-2 text-xs shadow-card">
      <p className="font-bold text-ink-900">{label}</p>
      <p className="text-ink-500">
        {point.hours > 0 ? `${point.hours} hrs` : 'No record'} ·{' '}
        <span style={{ color: FILL[point.status] }} className="font-semibold">
          {point.status === 'full' ? 'Full day' : point.status === 'half' ? 'Half day' : 'Leave/Absent'}
        </span>
      </p>
    </div>
  )
}

export function WeeklyAttendanceChart({ data }: { data: WeekPoint[] }) {
  return (
    <div>
      <div aria-hidden className="h-60 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.ink100} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.ink100 }}
              tick={{ fontSize: 12, fill: CHART_COLORS.ink500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[0, 9]}
              ticks={[0, 3, 6, 9]}
              tick={{ fontSize: 12, fill: CHART_COLORS.ink500 }}
              label={undefined}
            />
            <Tooltip cursor={{ fill: 'rgba(58,134,255,0.06)' }} content={<ChartTooltip />} />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} maxBarSize={34}>
              {data.map((entry) => (
                <Cell key={entry.day} fill={FILL[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5" aria-label="Chart legend">
        <li className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Full day
        </li>
        <li className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-purple-300" /> Half day
        </li>
        <li className="flex items-center gap-2 text-xs font-medium text-ink-500">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-pink-300" /> Leave/Absent
        </li>
      </ul>
      <p className={cn('sr-only')}>Bar chart of this week&apos;s worked hours, colored by attendance status.</p>
    </div>
  )
}
