import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import sideArt from '@/assets/image7.jpg'
import photoA from '@/assets/image2.jpg'
import photoB from '@/assets/image3.jpg'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-cream">
      <aside aria-hidden className="relative hidden w-[42%] overflow-hidden bg-ink-900 lg:block">
        <img src={sideArt} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink-900/95 via-purple-600/45 to-transparent" />
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
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-500 px-3.5 py-1.5 text-xs font-bold tracking-wide text-white shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-pink-300" />
              HR OPERATIONS, IN ONE FLOW
            </p>
          </div>

          <div className="flex items-end gap-5">
            <img
              src={photoA}
              alt=""
              className="h-28 w-40 -rotate-3 rounded-xl border-4 border-white object-cover shadow-pop"
            />
            <img
              src={photoB}
              alt=""
              className="mb-6 h-28 w-40 rotate-2 rounded-xl border-4 border-white object-cover shadow-pop"
            />
          </div>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-ink-100 bg-surface-0 p-6 shadow-card sm:p-8">{children}</div>
          <p className="mt-6 text-center text-xs text-ink-500">© 2026 Oidos India · Dayflow HRMS</p>
        </div>
      </main>
    </div>
  )
}
