import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Copy, LogIn, LogOut } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/lib/toast-context'
import { useStore, type NewEmployeeInput } from '@/lib/store-context'
import type { User } from '@/lib/mock-data'

export function NewEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createEmployee, users } = useStore()
  const { toast } = useToast()
  const [created, setCreated] = useState<{ user: User; tempPassword: string } | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    manager: 'Priya Sharma',
    location: 'Bengaluru, IN',
    monthlyWage: 50000,
    joiningDate: new Date().toISOString().slice(0, 10),
  })
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.joiningDate) {
      setError('First name, last name, email and joining date are required.')
      return
    }
    const input: NewEmployeeInput = { ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.trim() }
    const result = createEmployee(input)
    setCreated(result)
    toast(`Employee account created — Login ID ${result.user.loginId}`)
  }

  const close = () => {
    setCreated(null)
    setCopiedId(false)
    setForm((f) => ({ ...f, firstName: '', lastName: '', email: '', phone: '' }))
    setError(null)
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title={created ? 'Account Created' : 'New Employee'} width="max-w-xl">
      {created ? (
        <div className="space-y-4" aria-live="polite">
          <p className="text-sm text-ink-700">
            <span className="font-bold text-ink-900">
              {created.user.firstName} {created.user.lastName}
            </span>{' '}
            can now sign in. Share these credentials securely — the password must be changed after first login.
          </p>
          <dl className="space-y-2 rounded-xl border border-ink-100 bg-cream/70 p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-ink-700">Login ID</dt>
              <dd className="flex items-center gap-2">
                <code className="rounded-lg bg-surface-0 px-2 py-1 font-bold text-blue-600">{created.user.loginId}</code>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(created.user.loginId).catch(() => {})
                    setCopiedId(true)
                  }}
                  aria-label="Copy login ID"
                  className="rounded-lg p-1 text-ink-500 hover:text-blue-500 focus-ring"
                >
                  {copiedId ? <Check size={14} className="text-success-500" aria-hidden /> : <Copy size={14} aria-hidden />}
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-ink-700">Temp password</dt>
              <dd>
                <code className="rounded-lg bg-surface-0 px-2 py-1 font-bold text-purple-600">{created.tempPassword}</code>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-ink-700">Format</dt>
              <dd className="text-xs text-ink-500">[Company2][Name2+2][Year][Serial]</dd>
            </div>
          </dl>
          <div className="flex justify-end">
            <Button variant="primary" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="First Name" value={form.firstName} onChange={(e) => set('firstName')(e.target.value)} placeholder="Asha" autoComplete="off" />
          <Input label="Last Name" value={form.lastName} onChange={(e) => set('lastName')(e.target.value)} placeholder="Kaur" autoComplete="off" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} placeholder="asha.kaur@oidos.in" />
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+91 90000 00000" />

          <div>
            <label htmlFor="ne-dept" className="mb-1.5 block text-xs font-semibold text-ink-700">Department</label>
            <select
              id="ne-dept"
              value={form.department}
              onChange={(e) => set('department')(e.target.value)}
              className="w-full rounded-xl border border-ink-100 bg-surface-0 px-3.5 py-2.5 text-sm text-ink-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {['Engineering', 'Design', 'Marketing', 'Finance', 'People Ops'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ne-mgr" className="mb-1.5 block text-xs font-semibold text-ink-700">Manager</label>
            <select
              id="ne-mgr"
              value={form.manager}
              onChange={(e) => set('manager')(e.target.value)}
              className="w-full rounded-xl border border-ink-100 bg-surface-0 px-3.5 py-2.5 text-sm text-ink-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {users.filter((u) => u.role !== 'employee').map((u) => (
                <option key={u.id} value={`${u.firstName} ${u.lastName}`}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <Input label="Location" value={form.location} onChange={(e) => set('location')(e.target.value)} />
          <Input
            label="Monthly Wage (₹)"
            type="number"
            min={10000}
            step={1000}
            value={String(form.monthlyWage)}
            onChange={(e) => setForm((f) => ({ ...f, monthlyWage: Number(e.target.value) || 0 }))}
          />
          <Input
            label="Joining Date"
            type="date"
            value={form.joiningDate}
            onChange={(e) => set('joiningDate')(e.target.value)}
            hint="Login ID serial is generated per joining year"
            className="sm:col-span-2"
          />

          {error && (
            <p role="alert" className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-500 sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" variant="primary" className="px-6">
              Create Account
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function CheckInOutWidget() {
  const { currentUser, recordFor, checkInNow, checkOutNow, todayISO } = useStore()
  const { toast } = useToast()

  if (!currentUser) return null
  const rec = recordFor(currentUser.id, todayISO)
  const checkedIn = Boolean(rec?.checkIn)
  const checkedOut = Boolean(rec?.checkOut)

  return (
    <aside
      aria-label="Check in widget"
      className="fixed right-4 bottom-4 z-40 w-[calc(100vw-2rem)] max-w-[240px] rounded-2xl border border-ink-100 bg-surface-0 p-4 sm:right-6 sm:bottom-6"
    >
      <div className="mb-2 flex items-center gap-2">
        <span aria-hidden className={`relative flex h-3 w-3`}>
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-30 ${checkedIn ? 'bg-success-500' : 'bg-danger-500'}`} />
          <span className={`relative inline-flex h-3 w-3 rounded-full ${checkedIn ? 'bg-success-500' : 'bg-danger-500'}`} />
        </span>
        <span className="text-sm font-bold text-ink-900">{checkedIn ? (checkedOut ? 'Checked out' : "You're checked in") : 'Not checked in'}</span>
      </div>

      <p className="mb-3 text-xs text-ink-500">
        {rec?.checkIn ? `Since ${rec.checkIn}${rec.checkOut ? ` · out ${rec.checkOut}` : ''}` : 'Tap below when you reach office'}
      </p>

      {!checkedIn ? (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            checkInNow()
            toast(`Checked in at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`)
          }}
        >
          Check In <LogIn size={15} aria-hidden />
        </Button>
      ) : (
        <Button
          variant="danger"
          className="w-full"
          disabled={checkedOut}
          onClick={() => {
            checkOutNow()
            toast('Checked out — see you tomorrow!')
          }}
        >
          Check Out <LogOut size={15} aria-hidden />
        </Button>
      )}
    </aside>
  )
}
