import { CalendarCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  markOnly = false,
  tone = 'dark',
}: {
  className?: string
  markOnly?: boolean
  tone?: 'dark' | 'light'
}) {
  const light = tone === 'light'
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-xl shadow-card',
          light
            ? 'border border-white/25 bg-white/15 text-white backdrop-blur-sm'
            : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white',
        )}
      >
        <CalendarCheck size={17} strokeWidth={2.4} />
      </span>
      {!markOnly && (
        <span className={cn('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-ink-900')}>
          Day
          <span className={light ? 'text-pink-300' : 'bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent'}>
            flow
          </span>
        </span>
      )}
    </span>
  )
}
