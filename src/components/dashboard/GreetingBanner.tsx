import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function GreetingBanner({
  firstName,
  checkedInAt,
  dateMessage,
  emoji,
}: {
  firstName: string
  checkedInAt: string | null
  dateMessage: string
  emoji: string
}) {
  return (
    <section
      aria-label="Daily greeting"
      className="flex items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-pink-300 px-6 py-7 sm:px-7"
    >
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {firstName} 👋
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          {checkedInAt ? (
            <>
              You&apos;re checked in at <span className="font-bold text-purple-500">{checkedInAt}</span> · {dateMessage}
            </>
          ) : (
            <>You&apos;re not checked in yet · {dateMessage}</>
          )}
        </p>
      </div>
      <span aria-hidden className="text-4xl sm:text-5xl select-none">
        {emoji}
      </span>
    </section>
  )
}

const accents = {
  blue: { border: 'border-t-blue-500', chip: 'bg-blue-50 text-blue-500' },
  purple: { border: 'border-t-purple-500', chip: 'bg-purple-50 text-purple-600' },
  pink: { border: 'border-t-pink-400', chip: 'bg-pink-50 text-pink-400' },
} as const

export function StatCard({
  accent,
  icon,
  title,
  children,
}: {
  accent: keyof typeof accents
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  const a = accents[accent]
  return (
    <article className={cn('rounded-2xl border border-ink-100 bg-surface-0 p-5 transition-colors hover:border-ink-900', a.border)}>
      <div className="mb-3 flex items-center gap-3">
        <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center rounded-lg', a.chip)}>
          {icon}
        </span>
        <h2 className="text-sm font-bold text-ink-700">{title}</h2>
      </div>
      {children}
    </article>
  )
}
