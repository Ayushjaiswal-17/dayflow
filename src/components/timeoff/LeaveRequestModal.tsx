import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Paperclip } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useStore } from '@/lib/store-context'
import type { LeaveType } from '@/lib/mock-data'

const TYPE_LABEL: Record<LeaveType, string> = {
  paid: 'Paid time off',
  sick: 'Sick leave',
  unpaid: 'Unpaid leave',
}

export function LeaveRequestModal({
  open,
  onClose,
  allowEmployeePick = false,
}: {
  open: boolean
  onClose: () => void
  allowEmployeePick?: boolean
}) {
  const { currentUser, users, addLeaveRequest } = useStore()
  const { toast } = useToast()
  const [pickedId, setPickedId] = useState('')
  const [type, setType] = useState<LeaveType>('paid')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // No effect needed: fall back to the signed-in user until a pick is made.
  const targetUser =
    users.find((u) => u.id === (allowEmployeePick ? pickedId : '')) ?? currentUser

  const days = useMemo(() => {
    if (!start || !end || end < start) return 0
    let count = 0
    const cur = new Date(start + 'T00:00:00')
    const stop = new Date(end + 'T00:00:00')
    while (cur.getTime() <= stop.getTime()) {
      if (cur.getDay() !== 0 && cur.getDay() !== 6) count++
      cur.setDate(cur.getDate() + 1)
    }
    return count
  }, [start, end])

  const reset = () => {
    setType('paid')
    setStart('')
    setEnd('')
    setAttachmentName(null)
    setError(null)
  }

  if (!currentUser || !targetUser) return null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!start || !end) {
      setError('Please pick a validity period (start and end date).')
      return
    }
    if (end < start) {
      setError('End date cannot be before the start date.')
      return
    }
    if (days === 0) {
      setError('The selected period contains no working days.')
      return
    }
    addLeaveRequest({
      employeeId: targetUser.id,
      employeeName: `${targetUser.firstName} ${targetUser.lastName}`,
      type,
      startDate: start,
      endDate: end,
      attachment: Boolean(attachmentName),
    })
    toast(`Time-off request saved · ${days} working day${days === 1 ? '' : 's'}`)
    reset()
    onClose()
  }

  const fieldCls =
    'w-full rounded-xl border border-ink-100 bg-surface-0 px-3.5 py-2.5 text-sm text-ink-900 transition-colors hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  return (
    <Modal open={open} onClose={onClose} title="New Time-off Request">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="leave-employee" className="mb-1.5 block text-xs font-semibold text-ink-700">
            Employee
          </label>
          {allowEmployeePick ? (
            <select id="leave-employee" value={targetUser.id} onChange={(e) => setPickedId(e.target.value)} className={fieldCls}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="leave-employee"
              readOnly
              value={`${targetUser.firstName} ${targetUser.lastName} · ${targetUser.department}`}
              className="w-full cursor-not-allowed rounded-xl border border-ink-100 bg-cream px-3.5 py-2.5 text-sm text-ink-700"
            />
          )}
        </div>

        <div>
          <label htmlFor="leave-type" className="mb-1.5 block text-xs font-semibold text-ink-700">
            Time off Type
          </label>
          <select id="leave-type" value={type} onChange={(e) => setType(e.target.value as LeaveType)} className={fieldCls}>
            {(Object.keys(TYPE_LABEL) as LeaveType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label htmlFor="leave-start" className="mb-1.5 block text-xs font-semibold text-ink-700">
              Start Date
            </label>
            <input id="leave-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fieldCls} />
          </div>
          <span aria-hidden className="hidden pb-2.5 text-sm font-bold text-ink-500 sm:block">
            To
          </span>
          <div>
            <label htmlFor="leave-end" className="mb-1.5 block text-xs font-semibold text-ink-700">
              End Date
            </label>
            <input id="leave-end" type="date" min={start || undefined} value={end} onChange={(e) => setEnd(e.target.value)} className={fieldCls} />
          </div>
        </fieldset>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-700">Allocation</span>
          <p aria-live="polite" className="rounded-xl bg-blue-50 px-3.5 py-2.5 text-sm font-bold text-blue-700">
            {days.toFixed(3)} Days
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ink-700">Attachment</span>
          <label
            htmlFor="leave-attachment"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-purple-300 bg-purple-50/50 px-4 py-4 text-sm text-ink-500 transition-colors hover:bg-purple-300/20 focus-within:ring-2 focus-within:ring-blue-500"
          >
            <Paperclip size={16} aria-hidden />
            {attachmentName ?? 'Upload certificate (optional — required for sick leave)'}
          </label>
          <input id="leave-attachment" type="file" className="sr-only" onChange={(e) => setAttachmentName(e.target.files?.[0]?.name ?? null)} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-500">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="px-6">
            Submit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
