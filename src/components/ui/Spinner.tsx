import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
      <Loader2 size={18} className="animate-spin text-blue-500" aria-hidden />
      <span>{label}…</span>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-100 bg-cream/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">{icon}</div>
      <p className="text-sm font-bold text-ink-900">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-xs text-ink-500">{subtitle}</p>}
    </div>
  )
}
