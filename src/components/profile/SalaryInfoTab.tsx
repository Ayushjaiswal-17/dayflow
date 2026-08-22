import { useMemo, useState } from 'react'
import { AlertTriangle, Banknote, CalendarX2, PiggyBank, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardTitle } from '@/components/ui/Card'
import { useToast } from '@/lib/toast-context'
import { useStore } from '@/lib/store-context'
import {
  computeComponents,
  computeDeductions,
  computePayableDays,
  grossTotal,
} from '@/lib/mock-data'
import type { SalaryConfig, User } from '@/lib/mock-data'
import { currencyINR, monthName } from '@/lib/utils'

function NumberField({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  min = 0,
  step = 1,
  readOnly = false,
}: {
  id: string
  label: string
  value: number
  onChange?: (n: number) => void
  prefix?: string
  suffix?: string
  min?: number
  step?: number
  readOnly?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-700">
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border border-ink-100 px-3 transition-colors ${
          readOnly ? 'bg-cream/70' : 'bg-surface-0 hover:border-ink-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500'
        }`}
      >
        {prefix && <span aria-hidden className="pr-1.5 text-sm font-semibold text-ink-500">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          readOnly={readOnly}
          value={readOnly ? Math.round(value) : value}
          onChange={(e) => onChange?.(Math.max(min, Number(e.target.value) || 0))}
          className="w-full bg-transparent py-2.5 text-sm font-bold text-ink-900 outline-none read-only:text-ink-700"
        />
        {suffix && <span aria-hidden className="pl-1.5 text-xs whitespace-nowrap text-ink-500">{suffix}</span>}
      </div>
    </div>
  )
}

export function SalaryInfoTab({ user }: { user: User }) {
  const { attendance, leaves, updateSalaryConfig } = useStore()
  const { toast } = useToast()
  const [cfg, setCfg] = useState<SalaryConfig>(user.salaryConfig)
  const [saving, setSaving] = useState(false)

  const patch = (p: Partial<SalaryConfig>) => setCfg((c) => ({ ...c, ...p }))
  const setComponentValue = (id: string, value: number) =>
    setCfg((c) => ({ ...c, components: c.components.map((comp) => (comp.id === id ? { ...comp, value } : comp)) }))
  const setComponentType = (id: string, type: 'fixed' | 'percentage') =>
    setCfg((c) => ({ ...c, components: c.components.map((comp) => (comp.id === id ? { ...comp, type } : comp)) }))

  const isBasicId = useMemo(() => {
    const basic = user.salaryConfig.components.find((c) => c.name.toLowerCase().includes('basic'))
    return basic?.id ?? ''
  }, [user.salaryConfig.components])

  const computed = useMemo(() => computeComponents(cfg), [cfg])
  const total = grossTotal(computed)
  const overWage = total > cfg.monthlyWage
  const basicAmount = computed.find((c) => c.id === isBasicId)?.amount ?? cfg.monthlyWage
  const deduc = computeDeductions(cfg, basicAmount)
  const netPay = Math.max(0, total - deduc.total)

  // Attendance-driven payroll basis (spec §9.2): unpaid leave + missing days
  // reduce the payable days used for payslip computation.
  const now = new Date()
  const payroll = computePayableDays(user, now.getFullYear(), now.getMonth(), attendance, leaves)
  const proRataGross = payroll.workingDays > 0 ? Math.round((cfg.monthlyWage * payroll.payableDays) / payroll.workingDays) : 0

  const dirty = JSON.stringify(cfg) !== JSON.stringify(user.salaryConfig)

  const onSave = async () => {
    if (overWage) return
    setSaving(true)
    await new Promise((r) => setTimeout(r, 350))
    updateSalaryConfig(user.id, cfg)
    setSaving(false)
    toast('Salary structure saved')
  }

  return (
    <div className="space-y-4">
      {/* Header — wages */}
      <Card className="p-5">
        <CardTitle>Month Wage</CardTitle>
        <p className="mt-0.5 mb-4 text-xs text-ink-500">Components auto-update whenever the wage changes.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField id="wage-month" label="Monthly Wage" value={cfg.monthlyWage} onChange={(n) => patch({ monthlyWage: n })} prefix="₹" suffix="/ month" step={1000} />
          <NumberField id="wage-year" label="Yearly Wage" value={cfg.monthlyWage * 12} readOnly prefix="₹" suffix="/ year" />
          <NumberField id="work-days" label="Working Days / Week" value={cfg.workingDaysPerWeek} onChange={(n) => patch({ workingDaysPerWeek: Math.min(7, n) })} suffix="days" />
          <NumberField id="break-time" label="Break Time" value={cfg.breakTimeHours} onChange={(n) => patch({ breakTimeHours: Math.min(4, n) })} suffix="hrs" step={0.5} />
        </div>
      </Card>

      {/* Components */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-ink-100 p-5 pb-4">
          <CardTitle>Salary Components</CardTitle>
          <p className="mt-0.5 text-xs text-ink-500">
            Percentage rows resolve against Monthly Wage for Basic and against the Basic amount otherwise.
          </p>
        </div>
        <ul role="list" className="divide-y divide-ink-100">
          <li className="hidden grid-cols-[1fr_150px_110px_120px] gap-3 px-5 py-2.5 text-[11px] font-bold tracking-wide text-ink-500 uppercase sm:grid">
            <span>Component</span>
            <span>Computation</span>
            <span>Value</span>
            <span className="text-right">Amount / month</span>
          </li>
          {computed.map((comp) => (
            <li key={comp.id} className="grid grid-cols-1 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-cream/40 sm:grid-cols-[1fr_150px_110px_120px]">
              <div>
                <p className="text-sm font-bold text-ink-900">{comp.name}</p>
                <p className="text-xs text-ink-500 sm:hidden">
                  {comp.type === 'fixed' ? 'Fixed' : `${comp.value}% ${comp.id === isBasicId ? 'of wage' : 'of basic'}`} ·{' '}
                  {currencyINR(Math.round(comp.amount))}
                </p>
              </div>
              <select
                aria-label={`Computation type for ${comp.name}`}
                value={comp.type}
                onChange={(e) => setComponentType(comp.id, e.target.value as 'fixed' | 'percentage')}
                className="rounded-xl border border-ink-100 bg-surface-0 px-2.5 py-2 text-xs font-semibold text-ink-700 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">{comp.id === isBasicId ? '% of Wage' : '% of Basic'}</option>
              </select>
              <input
                type="number"
                min={0}
                aria-label={`${comp.type === 'fixed' ? 'Amount' : 'Percentage'} for ${comp.name}`}
                value={comp.value}
                onChange={(e) => setComponentValue(comp.id, Math.max(0, Number(e.target.value) || 0))}
                className="rounded-xl border border-ink-100 bg-surface-0 px-2.5 py-2 text-sm font-bold text-ink-900 hover:border-ink-300 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <p className="text-right text-sm font-extrabold text-ink-900">{currencyINR(Math.round(comp.amount))}</p>
            </li>
          ))}
          <li className="flex flex-wrap items-center justify-between gap-2 bg-cream/60 px-5 py-3.5">
            <span className="text-sm font-bold text-ink-700">
              Total {overWage && <Badge tone="danger"><AlertTriangle size={11} aria-hidden /> exceeds wage</Badge>}
              {!overWage && total === cfg.monthlyWage && <Badge tone="success">matches wage</Badge>}
            </span>
            <span className={`text-base font-extrabold ${overWage ? 'text-danger-500' : 'text-ink-900'}`}>{currencyINR(total)}</span>
          </li>
        </ul>
      </Card>

      {/* Deductions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Deductions</CardTitle>
          <p className="mt-0.5 mb-4 text-xs text-ink-500">Calculated on the Basic Salary amount of {currencyINR(Math.round(basicAmount))}.</p>
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-cream/60 px-3.5 py-2.5">
              <dt className="font-medium text-ink-700">PF — Employee ({cfg.pfRate}% of Basic)</dt>
              <dd className="font-bold text-ink-900">{currencyINR(deduc.pfEmployee)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-cream/60 px-3.5 py-2.5">
              <dt className="font-medium text-ink-700">PF — Employer ({cfg.pfRate}% of Basic)</dt>
              <dd className="font-bold text-ink-900">{currencyINR(deduc.pfEmployer)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-cream/60 px-3.5 py-2.5">
              <dt className="font-medium text-ink-700">Professional Tax</dt>
              <dd className="font-bold text-ink-900">{currencyINR(deduc.professionalTax)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 px-3.5 pt-1">
              <dt className="font-bold text-ink-900">Total Deductions</dt>
              <dd className="font-extrabold text-danger-500">{currencyINR(deduc.total)}</dd>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-success-500/30 bg-success-50 px-3.5 py-3">
              <dt className="inline-flex items-center gap-2 font-bold text-ink-900">
                <Banknote size={16} className="text-success-500" aria-hidden /> Estimated Net Pay
              </dt>
              <dd className="font-extrabold text-success-500">{currencyINR(netPay)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <CardTitle>Configuration</CardTitle>
          <p className="mt-0.5 mb-4 text-xs text-ink-500">Statutory defaults applied to every payslip run.</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField id="pf-rate" label="PF Rate" value={cfg.pfRate} onChange={(n) => patch({ pfRate: Math.min(24, n) })} suffix="% of Basic" />
            <NumberField id="prof-tax" label="Professional Tax" value={cfg.professionalTax} onChange={(n) => patch({ professionalTax: n })} prefix="₹" suffix="/ month" step={50} />
          </div>
          <div className="mt-4 rounded-xl border border-purple-50 bg-purple-50/60 p-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-700">
              <PiggyBank size={15} className="mt-0.5 shrink-0 text-purple-600" aria-hidden />
              Employer PF is a company cost on top of gross; employee PF and professional tax are withheld from net pay.
            </p>
          </div>
        </Card>
      </div>

      {/* Payable days — attendance feeds payslip */}
      <Card className="border-blue-100 p-5">
        <CardTitle>Payable Days · {monthName(now.getMonth())} {now.getFullYear()}</CardTitle>
        <p className="mt-0.5 mb-4 text-xs text-ink-500">
          Generated attendance records drive payslip computation — unpaid leave and missing days are excluded automatically.
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-cream/70 px-3.5 py-3">
            <p className="text-[11px] font-bold tracking-wide text-ink-500 uppercase">Working Days</p>
            <p className="text-lg font-extrabold text-ink-900">{payroll.workingDays}</p>
          </div>
          <div className="rounded-xl bg-warning-50 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink-500 uppercase">
              <CalendarX2 size={12} aria-hidden /> Unpaid Leave
            </p>
            <p className="text-lg font-extrabold text-ink-900">−{payroll.unpaidLeaveDays}</p>
          </div>
          <div className="rounded-xl bg-danger-50 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink-500 uppercase">
              <AlertTriangle size={12} aria-hidden /> Missing Days
            </p>
            <p className="text-lg font-extrabold text-ink-900">−{payroll.missingDays}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
            <p className="text-[11px] font-bold tracking-wide text-blue-600 uppercase">Payable Days</p>
            <p className="text-lg font-extrabold text-blue-700">{payroll.payableDays}</p>
          </div>
        </div>
        <p className="mt-4 rounded-xl bg-cream/70 px-4 py-3 text-sm text-ink-700">
          Pro-rated gross for this month:{' '}
          <span className="font-extrabold text-ink-900">
            {currencyINR(proRataGross)}
          </span>{' '}
          <span className="text-xs text-ink-500">
            ({currencyINR(cfg.monthlyWage)} × {payroll.payableDays}/{payroll.workingDays})
          </span>
        </p>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-surface-0/95 px-5 py-3.5 backdrop-blur">
        <p className="text-xs text-ink-500">
          {overWage ? (
            <span className="font-semibold text-danger-500">Total components exceed the monthly wage — reduce them before saving.</span>
          ) : dirty ? (
            'Unsaved changes'
          ) : (
            'All changes saved'
          )}
        </p>
        <Button variant="primary" disabled={overWage || !dirty || saving} onClick={onSave}>
          <Save size={15} aria-hidden /> {saving ? 'Saving…' : 'Save Structure'}
        </Button>
      </div>
    </div>
  )
}
