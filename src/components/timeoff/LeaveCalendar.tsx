import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { LeaveRequest } from '@/lib/mock-data'
import { toISO } from '@/lib/mock-data'
import { monthName, cn } from '@/lib/utils'

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function LeaveCalendar({ leaves }: { leaves: LeaveRequest[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const cells = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Monday-first offset
    const offset = (first.getDay() + 6) % 7

    const list: Array<{ iso: string; day: number | null }> = []
    for (let i = 0; i < offset; i++) list.push({ iso: '', day: null })
    for (let d = 1; d <= daysInMonth; d++) list.push({ day: d, iso: toISO(new Date(year, month, d)) })
    while (list.length % 7 !== 0) list.push({ iso: '', day: null })
    return list
  }, [cursor])

  const markerFor = (iso: string): 'approved' | 'pending' | null => {
    if (leaves.some((l) => l.status === 'approved' && iso >= l.startDate && iso <= l.endDate)) return 'approved'
    if (leaves.some((l) => l.status === 'pending' && iso >= l.startDate && iso <= l.endDate)) return 'pending'
    return null
  }

  return (
    <section aria-label="Leave calendar">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-ink-900">
          {monthName(cursor.getMonth())} {cursor.getFullYear()}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label="Previous month"
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring"
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label="Next month"
            className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring"
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={`${monthName(cursor.getMonth())} calendar`}>
        {DOW.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-bold tracking-wide text-ink-500 uppercase">
            {d}
          </span>
        ))}
        {cells.map((c, idx) => {
          if (!c.day || !c.iso) return <span key={`pad-${idx}`} aria-hidden />
          const dow = new Date(c.iso + 'T00:00:00').getDay()
          const weekend = dow === 0 || dow === 6
          const isToday = c.iso === toISO(today)
          const marker = markerFor(c.iso)
          return (
            <time
              key={c.iso}
              dateTime={c.iso}
              title={marker ? `Leave ${marker}` : undefined}
              className={cn(
                'relative flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                weekend ? 'bg-cream/80 text-ink-300' : 'text-ink-700 hover:bg-blue-50',
                isToday && 'ring-2 ring-purple-300',
                marker === 'approved' && 'bg-pink-100/80 text-pink-400',
                marker === 'pending' && 'bg-warning-50 text-warning-500',
              )}
            >
              {c.day}
              {isToday && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-purple-500" />}
            </time>
          )
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-pink-300" /> Approved leave</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-warning-500" /> Pending</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Today</li>
      </ul>
    </section>
  )
}
