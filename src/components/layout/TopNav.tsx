import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Search, UserRound, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Logo } from '@/components/ui/Logo'
import { useStore } from '@/lib/store-context'
import { cn } from '@/lib/utils'

const NAV_TABS = [
  { to: '/employees', label: 'Employees' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/timeoff', label: 'Time Off' },
]

export function TopNav() {
  const { currentUser, signOut, activities } = useStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [bellRead, setBellRead] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  if (!currentUser) return null
  const unread = !bellRead && activities.length > 0

  const submitSearch = () => {
    setSearchOpen(false)
    navigate(`/employees${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
    setQuery('')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-surface-0">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8">
        <Link to="/dashboard" className="rounded-lg focus-ring" aria-label="Dayflow home">
          <Logo />
        </Link>

        {/* Center pill tabs — desktop */}
        <ul className="hidden items-center gap-1 rounded-full bg-cream p-1 md:flex">
          {NAV_TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isActive ? 'bg-surface-0 text-ink-900 shadow-card' : 'text-ink-500 hover:text-ink-900',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5" ref={shellRef}>
          {searchOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submitSearch()
              }}
              role="search"
              className="flex items-center"
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => query === '' && setSearchOpen(false)}
                placeholder="Search employees…"
                aria-label="Search employees"
                className="w-36 rounded-xl border border-blue-100 bg-surface-0 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-300 transition-all focus:w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-44 sm:focus:w-60"
              />
            </form>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search employees"
              className="rounded-full p-2 text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring"
            >
              <Search size={19} aria-hidden />
            </button>
          )}

          <button
            onClick={() => {
              setBellOpen((v) => !v)
              setBellRead(true)
            }}
            aria-label={`Notifications${unread ? ' — unread' : ''}`}
            aria-expanded={bellOpen}
            className="relative rounded-full p-2 text-ink-500 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring"
          >
            <Bell size={19} aria-hidden />
            {unread && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-400 ring-2 ring-surface-0" />}
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Account menu"
            className="rounded-full focus-ring"
          >
            <Avatar initials={currentUser.avatarInitial} size="md" />
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="rounded-full p-2 text-ink-500 transition-colors hover:bg-blue-50 focus-ring md:hidden"
          >
            {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>

          {/* Notification popover */}
          {bellOpen && (
            <div role="dialog" aria-label="Recent notifications" className="absolute top-16 right-4 w-80 rounded-2xl border border-ink-100 bg-surface-0 p-3 shadow-pop">
              <p className="px-2 pb-2 pt-1 text-xs font-bold tracking-wide text-ink-500 uppercase">Notifications</p>
              <ul className="max-h-64 overflow-y-auto">
                {activities.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl px-2 py-2 hover:bg-cream">
                    <span className="text-sm font-semibold text-ink-900">{a.title}</span>
                    <span className="shrink-0 text-xs whitespace-nowrap text-ink-500">{a.timeAgo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avatar dropdown */}
          {menuOpen && (
            <div role="menu" aria-label="Account" className="absolute top-16 right-4 z-50 w-52 rounded-2xl border border-ink-100 bg-surface-0 p-1.5 shadow-pop">
              <div className="border-b border-ink-100 px-3 py-2">
                <p className="truncate text-sm font-bold text-ink-900">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="truncate text-xs text-ink-500">{currentUser.email}</p>
              </div>
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-blue-50 hover:text-blue-500 focus-ring"
              >
                <UserRound size={16} aria-hidden /> My Profile
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                  navigate('/auth/signin', { replace: true })
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-danger-50 hover:text-danger-500 focus-ring"
              >
                <LogOut size={16} aria-hidden /> Log Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile tabs */}
      {mobileOpen && (
        <ul className="border-t border-ink-100 bg-surface-0 px-4 py-2 md:hidden">
          {NAV_TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'my-1 block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                    isActive ? 'bg-blue-50 text-blue-500' : 'text-ink-700 hover:bg-cream',
                  )
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
