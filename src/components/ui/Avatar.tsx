import { cn } from '@/lib/utils'

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
} as const

export function Avatar({
  initials,
  size = 'md',
  className,
}: {
  initials: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      aria-hidden={false}
      role="img"
      aria-label={`Avatar of ${initials}`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-purple-500 font-bold text-white select-none',
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  )
}
