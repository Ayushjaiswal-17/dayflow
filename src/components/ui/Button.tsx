import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'pink' | 'purple'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 text-ink-900 hover:bg-blue-600 active:bg-blue-700',
  secondary: 'border-[1.5px] border-ink-900 bg-transparent text-ink-900 hover:bg-ink-900 hover:text-white',
  ghost: 'text-ink-500 hover:bg-blue-50 hover:text-ink-900',
  success: 'bg-success-500 text-white hover:bg-success-500/90',
  danger: 'bg-danger-500 text-white hover:bg-danger-500/90',
  pink: 'bg-pink-300 text-ink-900 hover:bg-pink-400',
  purple: 'bg-purple-500 text-white hover:bg-purple-600',
}

export function Button({ variant = 'primary', className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[transform,background-color,color,border-color]',
        'hover:-translate-y-0.5 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
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
