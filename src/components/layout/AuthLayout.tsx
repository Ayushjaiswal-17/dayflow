import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-100 bg-surface-0 p-6 shadow-card sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-ink-500">© 2026 Oidos India · Dayflow HRMS</p>
      </div>
    </div>
  )
}
