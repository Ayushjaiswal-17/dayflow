import { useState } from 'react'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/lib/toast-context'
import { useStore } from '@/lib/store-context'
import type { User } from '@/lib/mock-data'

function EditableText({
  label,
  value,
  readOnly,
  onSave,
}: {
  label: string
  value: string
  readOnly: boolean
  onSave: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!readOnly && editing) {
    return (
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <label className="mb-1.5 block text-xs font-bold text-ink-700">{label}</label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-ink-100 bg-surface-0 p-3 text-sm text-ink-700 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => { setDraft(value); setEditing(false) }}>
            <X size={14} aria-hidden /> Cancel
          </Button>
          <Button variant="primary" onClick={() => { onSave(draft); setEditing(false) }}>
            <Check size={14} aria-hidden /> Save
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-xl border border-transparent p-4 transition-colors hover:border-ink-100 hover:bg-cream/50">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-ink-700">{label}</h4>
        {!readOnly && (
          <button
            onClick={() => setEditing(true)}
            aria-label={`Edit ${label}`}
            className="rounded-lg p-1.5 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-500 focus-visible:opacity-100 focus-ring"
          >
            <Pencil size={13} aria-hidden />
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-ink-900">{value || <span className="text-ink-300 italic">Nothing here yet…</span>}</p>
    </div>
  )
}

export function ResumeTab({ user, editable }: { user: User; editable: boolean }) {
  const { updateResumeField } = useStore()
  const { toast } = useToast()
  const [skillInput, setSkillInput] = useState('')
  const [certInput, setCertInput] = useState('')
  const [addingSkill, setAddingSkill] = useState(false)
  const [addingCert, setAddingCert] = useState(false)

  const addSkill = () => {
    const v = skillInput.trim()
    if (!v) return
    updateResumeField(user.id, { skills: [...user.resume.skills, v] })
    toast(`Skill “${v}” added`)
    setSkillInput('')
    setAddingSkill(false)
  }

  const addCert = () => {
    const v = certInput.trim()
    if (!v) return
    updateResumeField(user.id, { certifications: [...user.resume.certifications, v] })
    toast(`Certification “${v}” added`)
    setCertInput('')
    setAddingCert(false)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-2">
        <EditableText
          label="About"
          value={user.resume.about}
          readOnly={!editable}
          onSave={(v) => updateResumeField(user.id, { about: v })}
        />
        <EditableText
          label="What I love about my job"
          value={user.resume.loveAboutJob}
          readOnly={!editable}
          onSave={(v) => updateResumeField(user.id, { loveAboutJob: v })}
        />
        <EditableText
          label="My interests and hobbies"
          value={user.resume.interestsHobbies}
          readOnly={!editable}
          onSave={(v) => updateResumeField(user.id, { interestsHobbies: v })}
        />
      </div>

      <div className="space-y-4">
        <section aria-label="Skills" className="rounded-2xl border border-ink-100 bg-surface-0 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Skills</h3>
            {editable && (
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setAddingSkill((v) => !v)}>
                <Plus size={14} aria-hidden /> Add Skills
              </Button>
            )}
          </div>
          {addingSkill && (
            <form
              onSubmit={(e) => { e.preventDefault(); addSkill() }}
              className="mb-3 flex gap-2"
            >
              <input
                autoFocus
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="e.g. Figma"
                aria-label="New skill"
                className="w-full rounded-xl border border-ink-100 px-3 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <Button type="submit" variant="primary" className="shrink-0">Add</Button>
            </form>
          )}
          {user.resume.skills.length === 0 && !addingSkill ? (
            <p className="text-sm text-ink-300 italic">No skills added yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {user.resume.skills.map((s) => (
                <li key={s} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Certifications" className="rounded-2xl border border-ink-100 bg-surface-0 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Certification</h3>
            {editable && (
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setAddingCert((v) => !v)}>
                <Plus size={14} aria-hidden /> Add Skills
              </Button>
            )}
          </div>
          {addingCert && (
            <form
              onSubmit={(e) => { e.preventDefault(); addCert() }}
              className="mb-3 flex gap-2"
            >
              <input
                autoFocus
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                placeholder="e.g. AWS CP"
                aria-label="New certification"
                className="w-full rounded-xl border border-ink-100 px-3 py-2 text-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <Button type="submit" variant="primary" className="shrink-0">Add</Button>
            </form>
          )}
          {user.resume.certifications.length === 0 && !addingCert ? (
            <p className="text-sm text-ink-300 italic">No certifications yet.</p>
          ) : (
            <ul className="space-y-2">
              {user.resume.certifications.map((c) => (
                <li key={c} className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2 text-xs font-semibold text-pink-400">
                  {c}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export function PrivateInfoTab({ user, editable }: { user: User; editable: boolean }) {
  const { updatePrivateInfo, updateBankDetails } = useStore()

  const fieldsLeft: Array<[string, keyof User]> = [
    ['Date of Birth', 'dateOfBirth'],
    ['Residing Address', 'address'],
    ['Nationality', 'nationality'],
    ['Gender', 'gender'],
    ['Marital Status', 'maritalStatus'],
    ['Personal Email', 'personalEmail'],
  ]
  const fieldsRight: Array<[string, keyof User['bankDetails']]> = [
    ['Account Number', 'accountNumber'],
    ['Bank Name', 'bankName'],
    ['IFSC Code', 'ifscCode'],
    ['PAN No.', 'panNo'],
    ['UAN No', 'uanNo'],
    ['ESI Code', 'esiCode'],
  ]

  const saveField = (key: keyof User, value: string) => {
    if (key === 'dateOfBirth') updatePrivateInfo(user.id, { dateOfBirth: value })
    else if (key === 'address') updatePrivateInfo(user.id, { address: value })
    else if (key === 'nationality') updatePrivateInfo(user.id, { nationality: value })
    else if (key === 'gender') updatePrivateInfo(user.id, { gender: value })
    else if (key === 'maritalStatus') updatePrivateInfo(user.id, { maritalStatus: value })
    else if (key === 'personalEmail') updatePrivateInfo(user.id, { personalEmail: value })
  }

  const inputCls =
    'w-full rounded-xl border border-ink-100 bg-cream/60 px-3.5 py-2.5 text-sm text-ink-700 read-only:text-ink-700 transition-colors focus-visible:border-blue-500 focus-visible:bg-surface-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <fieldset className="rounded-2xl border border-ink-100 bg-surface-0 p-5 shadow-card">
        <legend className="px-1 text-sm font-bold text-ink-900">Personal Details</legend>
        <div className="space-y-3 pt-2">
          {fieldsLeft.map(([label, key]) => (
            <div key={String(key)}>
              <label htmlFor={`pi-${String(key)}`} className="mb-1 block text-xs font-semibold text-ink-500">
                {label}
              </label>
              <input
                id={`pi-${String(key)}`}
                readOnly={!editable}
                defaultValue={String(user[key] ?? '')}
                onBlur={(e) => editable && e.target.value !== String(user[key] ?? '') && saveField(key, e.target.value)}
                className={`${inputCls} ${!editable ? 'cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-ink-100 bg-surface-0 p-5 shadow-card">
        <legend className="px-1 text-sm font-bold text-ink-900">Bank & Statutory</legend>
        <div className="space-y-3 pt-2">
          {fieldsRight.map(([label, key]) => (
            <div key={String(key)}>
              <label htmlFor={`pi-${String(key)}`} className="mb-1 block text-xs font-semibold text-ink-500">
                {label}
              </label>
              <input
                id={`pi-${String(key)}`}
                readOnly={!editable}
                defaultValue={user.bankDetails[key]}
                onBlur={(e) => editable && e.target.value !== user.bankDetails[key] && updateBankDetails(user.id, { [key]: e.target.value })}
                className={`${inputCls} ${!editable ? 'cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>
      </fieldset>
      {!editable && (
        <p className="text-xs text-ink-500 lg:col-span-2">
          Private info is view-only. Ask an HR administrator to make corrections.
        </p>
      )}
    </div>
  )
}
