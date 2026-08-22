import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, IdCard, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabPanel } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/Spinner'
import { ResumeTab, PrivateInfoTab } from '@/components/profile/ResumeTab'
import { SalaryInfoTab } from '@/components/profile/SalaryInfoTab'
import { SecurityTab } from '@/components/profile/SecurityTab'
import { useStore } from '@/lib/store-context'
import type { User } from '@/lib/mock-data'

const ROLE_LABEL: Record<User['role'], string> = {
  admin: 'Admin',
  hr: 'HR Officer',
  employee: 'Employee',
}

function ProfileHeader({ user }: { user: User }) {
  return (
    <header className="rounded-2xl border border-ink-100 bg-surface-0 p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar initials={user.avatarInitial} size="xl" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="app-page-title text-ink-900">
              {user.firstName} {user.lastName}
            </h1>
            <Badge tone={user.role === 'admin' ? 'pink' : user.role === 'hr' ? 'purple' : 'blue'}>{ROLE_LABEL[user.role]}</Badge>
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5"><Building2 size={14} aria-hidden /> {user.companyName}</span>
            <code className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
              <IdCard size={13} aria-hidden /> {user.loginId}
            </code>
          </p>
        </div>

        <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 border-t border-ink-100 pt-4 text-xs sm:ml-auto sm:w-auto sm:max-w-lg sm:border-none sm:pt-0 md:grid-cols-3">
          <div>
            <dt className="font-semibold text-ink-500">Department</dt>
            <dd className="mt-0.5 font-bold text-ink-900">{user.department}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1 font-semibold text-ink-500"><Mail size={12} aria-hidden /> Email</dt>
            <dd className="mt-0.5 truncate font-bold text-ink-900">{user.email}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1 font-semibold text-ink-500"><UserRound size={12} aria-hidden /> Manager</dt>
            <dd className="mt-0.5 truncate font-bold text-ink-900">{user.manager}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1 font-semibold text-ink-500"><Phone size={12} aria-hidden /> Mobile</dt>
            <dd className="mt-0.5 font-bold text-ink-900">{user.mobile}</dd>
          </div>
          <div>
            <dt className="inline-flex items-center gap-1 font-semibold text-ink-500"><MapPin size={12} aria-hidden /> Location</dt>
            <dd className="mt-0.5 truncate font-bold text-ink-900">{user.location}</dd>
          </div>
        </dl>
      </div>
    </header>
  )
}

function BackLink() {
  return (
    <Link to="/employees" className="inline-flex w-fit items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring">
      <ArrowLeft size={15} aria-hidden /> Back to directory
    </Link>
  )
}

export function EmployeeProfilePage() {
  const { id } = useParams()
  const { currentUser, users, isManagerRole } = useStore()
  const [tab, setTab] = useState('resume')

  if (!currentUser) return null

  // /profile renders the signed-in user's own profile.
  const user = !id || id === currentUser.id ? currentUser : users.find((u) => u.id === id)

  if (!user) {
    return (
      <>
        <BackLink />
        <EmptyState
          icon={<UserRound size={22} aria-hidden />}
          title="Employee not found"
          subtitle="This profile doesn't exist or you don't have access to it."
        />
      </>
    )
  }

  const isOwnProfile = user.id === currentUser.id
  // Role-based visibility: Salary Info only for Admin/HR viewers;
  // Security only on one's own profile.
  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(isManagerRole ? [{ id: 'salary', label: 'Salary Info' }] : []),
    ...(isOwnProfile ? [{ id: 'security', label: 'Security' }] : []),
  ]
  const safeTab = tabs.some((t) => t.id === tab) ? tab : 'resume'

  return (
    <div className="space-y-4 pb-16">
      <BackLink />
      <ProfileHeader user={user} />

      <Tabs tabs={tabs} activeId={safeTab} onChange={setTab} ariaLabel="Profile sections" />

      <TabPanel id="resume" active={safeTab === 'resume'}>
        {/* Employees edit their own resume; Admin/HR can edit anyone's. */}
        <ResumeTab user={user} editable={isOwnProfile || isManagerRole} />
      </TabPanel>

      <TabPanel id="private" active={safeTab === 'private'}>
        {/* Private info stays view-only for employees, editable for Admin/HR. */}
        <PrivateInfoTab user={user} editable={isManagerRole} />
      </TabPanel>

      {isManagerRole && (
        <TabPanel id="salary" active={safeTab === 'salary'}>
          <SalaryInfoTab user={user} />
        </TabPanel>
      )}

      {isOwnProfile && (
        <TabPanel id="security" active={safeTab === 'security'}>
          <SecurityTab user={user} />
        </TabPanel>
      )}
    </div>
  )
}
