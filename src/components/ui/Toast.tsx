import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { ToastContext } from '@/lib/toast-context'
import type { ToastTone } from '@/lib/toast-context'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

const icons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} className="text-success-500" aria-hidden />,
  error: <XCircle size={18} className="text-danger-500" aria-hidden />,
  info: <Info size={18} className="text-blue-500" aria-hidden />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback((message: string, tone: ToastTone = 'success') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, tone, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  return (
    <ToastContext.Provider value={useMemo(() => ({ toast }), [toast])}>
      {children}
      <div aria-live="polite" aria-label="Notifications" className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex animate-[toast-in_180ms_ease-out] items-start gap-2.5 rounded-2xl border border-ink-100 bg-surface-0 p-3.5 text-sm font-medium text-ink-900"
          >
            {icons[t.tone]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
