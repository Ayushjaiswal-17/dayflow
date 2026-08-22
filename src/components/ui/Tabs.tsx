import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
}

export function Tabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = 'Tabs',
  className,
}: {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  ariaLabel?: string
  className?: string
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex flex-wrap items-center gap-1 rounded-full bg-cream p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              'min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1',
              active ? 'bg-surface-0 text-ink-900' : 'text-ink-500 hover:text-ink-900',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export function TabPanel({ id, active, children }: { id: string; active: boolean; children: ReactNode }) {
  if (!active) return null
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0}>
      {children}
    </div>
  )
}
