import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus } from 'lucide-react'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'

export function SignUpPage() {
  const [companyName, setCompanyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // CRITICAL RULE: self-registration is not allowed in Dayflow. Accounts are
    // created by Admin / HR Officers only — the form below is intentionally inert.
    setError('Self-registration is disabled. Please contact your HR administrator.')
  }

  return (
    <AuthLayout>
      <div className="mb-8 flex justify-center">
        <Link to="/auth/signin" aria-label="Dayflow home" className="rounded-lg focus-ring">
          <Logo />
        </Link>
      </div>

      <h1 className="text-xl font-extrabold text-ink-900">Create your account</h1>
      <p className="mt-1 mb-6 text-sm text-ink-500">New employee accounts are provisioned by HR.</p>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="companyName" className="mb-1.5 block text-xs font-semibold text-ink-700">
            Company Name
          </label>
          <div className="flex items-center gap-2">
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Oidos India"
              className="w-full rounded-xl border border-ink-100 bg-surface-0 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <button
              type="button"
              title="Upload company logo"
              aria-label="Upload company logo"
              onClick={() => setError('Logo upload is available after your account is activated.')}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-dashed border-purple-300 bg-purple-50 text-purple-600 transition-colors hover:bg-purple-300/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ImagePlus size={18} aria-hidden />
            </button>
          </div>
        </div>

        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Cooper" autoComplete="name" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@oidos.in" autoComplete="email" />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" autoComplete="tel" />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />

        {error && (
          <p role="alert" className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-500">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full py-2.5">
          Sign Up
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/auth/signin" className="font-semibold text-blue-500 underline-offset-2 hover:text-blue-600 hover:underline focus-ring rounded">
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
