import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickAccessCard({
  title,
  cta,
  to,
  illustration,
  tone,
}: {
  title: string
  cta: string
  to: string
  illustration: ReactNode
  tone: 'blue' | 'purple'
}) {
  const navigate = useNavigate()
  const bg = tone === 'blue' ? 'bg-blue-50' : 'bg-purple-50'
  const btn = tone === 'blue' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
  const border = tone === 'blue' ? 'border-blue-100' : 'border-purple-50'

  return (
    <article className={cn('flex flex-col rounded-2xl border p-5 transition-colors hover:border-ink-900 sm:flex-row sm:items-center sm:gap-6', bg, border)}>
      <div aria-hidden className="mb-4 flex h-20 w-full items-center justify-center rounded-xl bg-surface-0/70 text-3xl select-none sm:mb-0 sm:h-16 sm:w-24">
        {illustration}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-base font-bold text-ink-900">{title}</h3>
        <button
          onClick={() => navigate(to)}
          className={cn(
            'inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
            btn,
          )}
        >
          {cta} <ArrowRight size={15} aria-hidden />
        </button>
      </div>
    </article>
  )
}
