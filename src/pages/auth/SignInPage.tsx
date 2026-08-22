import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { useStore } from '@/lib/store-context'

const DEMO_ACCOUNTS = [
  { label: 'Admin', login: 'aarav.mehta@oidos.in', password: 'Admin@123' },
  { label: 'HR Officer', login: 'priya.sharma@oidos.in', password: 'Hr@12345' },
  { label: 'Employee', login: 'OITODO20220001', password: 'Dayflow@123' },
]

export function SignInPage() {
  const { signIn } = useStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!identifier.trim() || !password) {
      setError('Please enter your Login ID / email and password.')
      return
    }
    setBusy(true)
    await new Promise((r) => setTimeout(r, 450)) // simulate network
    const err = signIn(identifier, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <AuthLayout>
      <div className="mb-8 flex justify-center">
        <Link to="/auth/signin" aria-label="Dayflow home" className="rounded-lg focus-ring">
          <Logo />
        </Link>
      </div>

      <h1 className="text-xl font-extrabold text-ink-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Sign in to your Dayflow workspace.</p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Login ID / Email"
          type="text"
          autoComplete="username"
          placeholder="e.g. OITODO20220001"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
        />

        {error && (
          <p role="alert" className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={busy} className="w-full py-2.5">
          {busy ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden /> Signing In…
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an Account?{' '}
        <Link to="/auth/signup" className="font-semibold text-blue-500 underline-offset-2 hover:text-blue-600 hover:underline focus-ring rounded">
          Sign Up
        </Link>
      </p>

      <details className="mt-6 rounded-xl border border-ink-100 bg-cream/70 p-3.5">
        <summary className="cursor-pointer text-xs font-bold text-ink-700 select-none">Demo credentials</summary>
        <ul className="mt-2 space-y-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.login} className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-ink-500">
              <span className="font-bold text-ink-700">{a.label}</span>
              <span>
                <code className="rounded bg-surface-0 px-1.5 py-0.5 text-[11px] text-blue-600">{a.login}</code>{' '}
                <code className="rounded bg-surface-0 px-1.5 py-0.5 text-[11px] text-purple-600">{a.password}</code>
              </span>
            </li>
          ))}
        </ul>
      </details>
    </AuthLayout>
  )
}
