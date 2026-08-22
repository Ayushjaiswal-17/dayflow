import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell flex min-h-screen bg-cream">
      <aside aria-hidden className="relative hidden w-[42%] overflow-hidden bg-ink-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,#fc5000_0_10%,transparent_38%),linear-gradient(135deg,#524ae9_0%,#070607_72%)]" />
        <div className="auth-halftone" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
          <Link to="/" className="w-fit rounded-lg focus-ring" tabIndex={-1}>
            <Logo tone="light" />
          </Link>

          <div>
            <h2 className="max-w-sm font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white">
              Every workday, <span className="text-pink-300">perfectly aligned.</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">
              Profiles, attendance, leave and payroll visibility — one clear rhythm for your whole team.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-3.5 py-1.5 text-xs font-bold tracking-wide text-ink-900">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-300" />
              HR OPERATIONS, IN ONE FLOW
            </p>
          </div>

          <div className="grid max-w-sm grid-cols-3 gap-2">
            <span className="h-20 rounded-2xl bg-blue-500" />
            <span className="mt-4 h-20 rounded-2xl bg-pink-300" />
            <span className="h-20 rounded-2xl bg-purple-500" />
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-ink-100 bg-surface-0 p-6 sm:p-8">{children}</div>
          <p className="mt-6 text-center text-xs text-ink-500">© 2026 Oidos India · dayflow HRMS</p>
        </div>
      </main>
    </div>
  )
}
