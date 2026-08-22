import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'blue' | 'purple' | 'pink' | 'success' | 'warning' | 'danger' | 'neutral'

const tones: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-600',
  pink: 'bg-pink-50 text-pink-400',
  success: 'bg-success-50 text-success-500',
  warning: 'bg-warning-50 text-warning-500',
  danger: 'bg-danger-50 text-danger-500',
  neutral: 'bg-ink-100 text-ink-500',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}
