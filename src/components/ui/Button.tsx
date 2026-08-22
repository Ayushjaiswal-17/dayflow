import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'pink' | 'purple'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
  secondary: 'border border-ink-100 bg-surface-0 text-ink-700 hover:border-ink-300 hover:text-ink-900',
  ghost: 'text-ink-500 hover:bg-blue-50 hover:text-blue-500',
  success: 'bg-success-500 text-white hover:bg-success-500/90',
  danger: 'bg-danger-500 text-white hover:bg-danger-500/90',
  pink: 'bg-pink-300 text-ink-900 hover:bg-pink-400',
  purple: 'bg-purple-600 text-white hover:bg-purple-600/90',
}

export function Button({ variant = 'primary', className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
