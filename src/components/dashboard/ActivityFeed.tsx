import { CalendarCheck2, Palmtree, UserRoundPen, Wallet } from 'lucide-react'
import type { Activity } from '@/lib/mock-data'

const TYPE_STYLES: Record<Activity['type'], { icon: typeof Wallet; chip: string }> = {
  checkin: { icon: CalendarCheck2, chip: 'bg-blue-50 text-blue-500' },
  leave: { icon: Palmtree, chip: 'bg-purple-50 text-purple-600' },
  salary: { icon: Wallet, chip: 'bg-pink-50 text-pink-400' },
  profile: { icon: UserRoundPen, chip: 'bg-blue-50 text-blue-500' },
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return (
    <ul aria-label="Recent activity">
      {activities.slice(0, 4).map((a, idx) => {
        const style = TYPE_STYLES[a.type]
        const Icon = style.icon
        return (
          <li key={a.id} className={idx < Math.min(activities.length, 4) - 1 ? 'border-b border-ink-100' : ''}>
            <div className="flex items-start gap-3 py-3.5 first:pt-1 last:pb-0">
              <span aria-hidden className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.chip}`}>
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink-900">{a.title}</p>
                <p className="truncate text-xs text-ink-500">{a.subtitle}</p>
              </div>
              <time className="shrink-0 pt-0.5 text-xs text-ink-500">{a.timeAgo}</time>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
