import { useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: ReactNode
}

export function Input({ label, hint, className, type = 'text', id, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && showPw ? 'text' : type}
          className={cn(
            'w-full rounded-full border border-ink-100 bg-surface-0 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500 transition-colors focus-ring',
            'hover:border-ink-300 focus-visible:border-purple-500 read-only:bg-cream/60 read-only:text-ink-700',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 transition-colors hover:text-ink-900 focus-ring rounded"
          >
            {showPw ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}
