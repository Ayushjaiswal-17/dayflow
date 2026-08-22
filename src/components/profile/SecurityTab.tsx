import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/lib/toast-context'
import { useStore } from '@/lib/store-context'
import type { User } from '@/lib/mock-data'

export function SecurityTab({ user }: { user: User }) {
  const { changePassword } = useStore()
  const { toast } = useToast()
  const [currentPw, setCurrentPw] = useState('')
  const [nextPw, setNextPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!currentPw || !nextPw || !confirmPw) {
      setError('All three fields are required.')
      return
    }
    if (nextPw.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (nextPw !== confirmPw) {
      setError('New password and confirmation do not match.')
      return
    }
    const err = changePassword(currentPw, nextPw)
    if (err) {
      setError(err)
      return
    }
    setCurrentPw('')
    setNextPw('')
    setConfirmPw('')
    toast('Password changed successfully')
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border border-ink-100 bg-surface-0 p-5">
        {user.mustChangePassword && (
          <p role="alert" className="rounded-xl bg-warning-50 px-4 py-3 text-sm font-medium text-warning-500">
            You&apos;re using a system-generated password. Set a new one to secure your account.
          </p>
        )}
        <Input label="Current Password" type="password" autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="New Password" type="password" autoComplete="new-password" value={nextPw} onChange={(e) => setNextPw(e.target.value)} placeholder="Min. 8 characters" />
          <Input label="Confirm New Password" type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-500">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary">
          Update Password
        </Button>
      </form>

      <aside aria-label="Security tips" className="rounded-2xl border border-purple-50 bg-purple-50/50 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <ShieldCheck size={16} className="text-purple-600" aria-hidden /> Good to know
        </h3>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-ink-700">
          <li className="flex gap-2"><KeyRound size={14} className="mt-0.5 shrink-0 text-purple-600" aria-hidden /> HR issues a temporary password when your account is created — replace it here after first login.</li>
          <li className="flex gap-2"><KeyRound size={14} className="mt-0.5 shrink-0 text-purple-600" aria-hidden /> Use at least 8 characters mixing letters, numbers and symbols.</li>
          <li className="flex gap-2"><KeyRound size={14} className="mt-0.5 shrink-0 text-purple-600" aria-hidden /> Never share your Login ID + password over email or chat.</li>
        </ul>
      </aside>
    </div>
  )
}
