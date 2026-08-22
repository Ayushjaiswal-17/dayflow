import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function LeaveCTA({ onApply }: { onApply: () => void }) {
  return (
    <section
      aria-label="Apply for leave"
      className="flex flex-col gap-4 rounded-2xl bg-purple-500 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7"
    >
      <div>
        <h2 className="text-base font-extrabold text-ink-900 sm:text-lg">Need a break? Apply for leave 🏖️</h2>
        <p className="mt-1 text-sm text-white/80">
          Your manager reviews requests within a day. Paid, sick and unpaid options available.
        </p>
      </div>
      <Button variant="pink" onClick={onApply} className="shrink-0 self-start px-5 py-2.5 sm:self-auto">
        Apply for Leave <ArrowRight size={16} aria-hidden />
      </Button>
    </section>
  )
}
