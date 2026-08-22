import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { useStore } from '@/lib/store-context'

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
    const err = await signIn(identifier, password)
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <AuthLayout>
      <div className="mb-8 flex justify-center">
        <Link to="/auth/signin" aria-label="dayflow home" className="rounded-lg focus-ring">
          <Logo />
        </Link>
      </div>

      <h1 className="text-xl font-extrabold text-ink-900">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">Sign in to your dayflow workspace.</p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input
          label="Login ID / Email"
          type="text"
          autoComplete="username"
          placeholder="you@example.com or your Login ID"
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

    </AuthLayout>
  )
}
