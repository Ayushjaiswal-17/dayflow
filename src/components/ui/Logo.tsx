import { CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-card"
      >
        <CalendarCheck size={17} strokeWidth={2.4} />
      </span>
      {!markOnly && (
        <span className="text-lg font-extrabold tracking-tight text-ink-900">
          Day<span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">flow</span>
        </span>
      )}
    </span>
  )
}
