import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  defaultSalaryConfig,
  generateLoginId,
  generateTempPassword,
  initialAttendance,
  initialLeaveRequests,
  initialUsers,
  toISO,
  type Activity,
  type ActivityType,
  type AttendanceRecord,
  type LeaveRequest,
  type LeaveStatus,
  type ResumeInfo,
  type SalaryConfig,
  type User,
} from './mock-data'
import { StoreContext, type AppStore, type NewEmployeeInput } from './store-context'

interface StoreState {
  users: User[]
  attendance: AttendanceRecord[]
  leaves: LeaveRequest[]
  activities: Activity[]
  currentUserId: string | null
}

const STORAGE_KEY = 'dayflow.store.v1'

function initialState(): StoreState {
  return {
    users: initialUsers,
    attendance: initialAttendance,
    leaves: initialLeaveRequests,
    activities: [
      { id: 'ac-1', type: 'checkin', title: 'Checked in', subtitle: 'You checked in at office', timeAgo: 'Just now' },
      { id: 'ac-2', type: 'leave', title: 'Leave approved', subtitle: 'Paid time off · approved by HR', timeAgo: '2h ago' },
      { id: 'ac-3', type: 'salary', title: 'Salary processed', subtitle: 'Payslip for last month is ready', timeAgo: '1d ago' },
      { id: 'ac-4', type: 'profile', title: 'Profile updated', subtitle: 'Bank details verified by HR', timeAgo: '3d ago' },
    ],
    currentUserId: null,
  }
}

function loadState(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<StoreState>
    if (!parsed.users?.length) return initialState()
    return { ...initialState(), ...parsed }
  } catch {
    return initialState()
  }
}

function weekdaysBetween(startISO: string, endISO: string): number {
  let count = 0
  const cur = new Date(startISO + 'T00:00:00')
  const end = new Date(endISO + 'T00:00:00')
  while (cur.getTime() <= end.getTime()) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

function time12ToDate(time12: string): Date {
  const [hm, ampm] = time12.split(' ')
  const [h, m] = hm.split(':').map(Number)
  const d = new Date()
  let hour = h % 12
  if (ampm.toUpperCase() === 'PM') hour += 12
  d.setHours(hour, m, 0, 0)
  return d
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // storage full/unavailable — mock app still works in-memory
    }
  }, [state])

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  )

  const pushActivity = useCallback((type: ActivityType, title: string, subtitle: string) => {
    setState((s) => ({
      ...s,
      activities: [{ id: `ac-${Date.now()}`, type, title, subtitle, timeAgo: 'Just now' }, ...s.activities].slice(0, 8),
    }))
  }, [])

  const signIn = useCallback(
    (identifier: string, password: string): string | null => {
      const id = identifier.trim().toLowerCase()
      const user = state.users.find((u) => u.email.toLowerCase() === id || u.loginId.toLowerCase() === id)
      if (!user) return 'No account found with that Login ID or email.'
      if (user.password !== password) return 'Incorrect password. Please try again.'
      setState((s) => ({ ...s, currentUserId: user.id }))
      return null
    },
    [state.users],
  )

  const signOut = useCallback(() => {
    setState((s) => ({ ...s, currentUserId: null }))
  }, [])

  const changePassword = useCallback(
    (currentPw: string, nextPw: string): string | null => {
      if (!currentUser) return 'Not signed in.'
      if (currentUser.password !== currentPw) return 'Current password is incorrect.'
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === currentUser.id ? { ...u, password: nextPw, mustChangePassword: false } : u,
        ),
      }))
      return null
    },
    [currentUser],
  )

  const completeFirstLogin = useCallback(() => {
    if (!currentUser) return
    setState((s) => ({ ...s, users: s.users.map((u) => (u.id === currentUser.id ? { ...u, mustChangePassword: false } : u)) }))
  }, [currentUser])

  const recordFor = useCallback(
    (userId: string, dateISO: string) => state.attendance.find((r) => r.employeeId === userId && r.date === dateISO),
    [state.attendance],
  )

  const checkInNow = useCallback(() => {
    if (!currentUser) return
    const iso = toISO(new Date())
    setState((s) => {
      const existing = s.attendance.find((r) => r.employeeId === currentUser.id && r.date === iso)
      if (existing && existing.checkIn) return s
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      const rec: AttendanceRecord =
        existing ?? { employeeId: currentUser.id, date: iso, checkIn: null, checkOut: null, workHours: 0, extraHours: 0, status: 'present' }
      const updated = { ...rec, checkIn: now, status: 'present' as const }
      return {
        ...s,
        attendance: existing
          ? s.attendance.map((r) => (r === existing ? updated : r))
          : [...s.attendance, updated],
      }
    })
    pushActivity('checkin', 'Checked in', `${currentUser.firstName} checked in at office`)
  }, [currentUser, pushActivity])

  const checkOutNow = useCallback(() => {
    if (!currentUser) return
    const iso = toISO(new Date())
    const breakH = currentUser.salaryConfig.breakTimeHours || 1
    setState((s) => {
      const existing = s.attendance.find((r) => r.employeeId === currentUser.id && r.date === iso)
      if (!existing || !existing.checkIn || existing.checkOut) return s
      const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      const startAt = time12ToDate(existing.checkIn)
      const endAt = time12ToDate(now)
      const gross = Math.max(0, (endAt.getTime() - startAt.getTime()) / 3600000)
      const workHours = Math.max(0, Math.round((gross - breakH) * 10) / 10)
      const extraHours = Math.max(0, Math.round((workHours - 8) * 10) / 10)
      return {
        ...s,
        attendance: s.attendance.map((r) =>
          r.employeeId === currentUser.id && r.date === iso ? { ...r, checkOut: now, workHours, extraHours } : r,
        ),
      }
    })
  }, [currentUser])

  const hasCheckedInToday = useCallback(
    (userId: string) => Boolean(recordFor(userId, toISO(new Date()))?.checkIn),
    [recordFor],
  )

  const addLeaveRequest = useCallback<AppStore['addLeaveRequest']>(
    (input) => {
      setState((s) => {
        const days = weekdaysBetween(input.startDate, input.endDate)
        const req: LeaveRequest = {
          id: `lv-${Date.now()}`,
          employeeId: input.employeeId,
          employeeName: input.employeeName,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          days,
          status: 'pending',
          attachment: input.attachment,
          appliedOn: toISO(new Date()),
        }
        return { ...s, leaves: [req, ...s.leaves] }
      })
      pushActivity('leave', 'Leave requested', 'Waiting for HR approval')
    },
    [pushActivity],
  )

  const setLeaveStatus = useCallback((id: string, status: LeaveStatus) => {
    setState((s) => ({ ...s, leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)) }))
  }, [])

  const createEmployee = useCallback(
    (input: NewEmployeeInput): { user: User; tempPassword: string } => {
      const tempPassword = generateTempPassword()
      let created: User | null = null
      setState((s) => {
        const loginId = generateLoginId('Oidos India', input.firstName, input.lastName, input.joiningDate, s.users)
        const user: User = {
          id: `u-${loginId.toLowerCase()}`,
          loginId,
          email: input.email,
          password: tempPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          role: 'employee',
          companyName: 'Oidos India',
          department: input.department,
          manager: input.manager,
          mobile: input.phone,
          location: input.location,
          avatarInitial: `${input.firstName[0]}${input.lastName[0]}`.toUpperCase(),
          dateOfBirth: '1990-01-01',
          joiningDate: input.joiningDate,
          nationality: 'Indian',
          gender: 'Female',
          maritalStatus: 'Single',
          address: 'Bengaluru, IN',
          personalEmail: '',
          bankDetails: {
            accountNumber: '—',
            bankName: '—',
            ifscCode: '—',
            panNo: '—',
            uanNo: '—',
            esiCode: '—',
          },
          resume: {
            about: '',
            loveAboutJob: '',
            interestsHobbies: '',
            skills: [],
            certifications: [],
          },
          salaryConfig: defaultSalaryConfig(input.monthlyWage),
          mustChangePassword: true,
        }
        created = user
        return { ...s, users: [...s.users, user] }
      })
      return { user: created!, tempPassword }
    },
    [],
  )

  const updateResumeField = useCallback((userId: string, patch: Partial<ResumeInfo>) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, resume: { ...u.resume, ...patch } } : u)),
    }))
  }, [])

  const updatePrivateInfo = useCallback((userId: string, patch: Partial<User>) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    }))
  }, [])

  const updateBankDetails = useCallback((userId: string, patch: Partial<User['bankDetails']>) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, bankDetails: { ...u.bankDetails, ...patch } } : u)),
    }))
  }, [])

  const updateSalaryConfig = useCallback((userId: string, config: SalaryConfig) => {
    setState((s) => ({
      ...s,
      users: s.users.map((u) => (u.id === userId ? { ...u, salaryConfig: config } : u)),
    }))
  }, [])

  const value: AppStore = {
    ...state,
    currentUser,
    isManagerRole: currentUser?.role === 'admin' || currentUser?.role === 'hr',
    signIn,
    signOut,
    changePassword,
    completeFirstLogin,
    todayISO: toISO(new Date()),
    recordFor,
    checkInNow,
    checkOutNow,
    hasCheckedInToday,
    addLeaveRequest,
    setLeaveStatus,
    createEmployee,
    updateResumeField,
    updatePrivateInfo,
    updateBankDetails,
    updateSalaryConfig,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
