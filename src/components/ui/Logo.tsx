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
          'flex h-8 w-8 items-center justify-center rounded-full font-display text-lg font-bold leading-none',
          light ? 'bg-white text-ink-900' : 'bg-ink-900 text-white',
        )}
      >
        D
      </span>
      {!markOnly && (
        <span className={cn('text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-ink-900')}>
          day<span className={light ? 'text-pink-300' : 'text-blue-500'}>flow</span>
        </span>
      )}
    </span>
  )
}
