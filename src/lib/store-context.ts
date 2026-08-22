import { createContext, useContext } from 'react'
import type {
  Activity,
  AttendanceRecord,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  ResumeInfo,
  SalaryConfig,
  User,
} from './mock-data'

export interface NewEmployeeInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  manager: string
  location: string
  monthlyWage: number
  joiningDate: string
}

export interface AppStore {
  users: User[]
  attendance: AttendanceRecord[]
  leaves: LeaveRequest[]
  activities: Activity[]
  currentUserId: string | null
  currentUser: User | null
  isManagerRole: boolean
  todayISO: string
  signIn(identifier: string, password: string): string | null
  signOut(): void
  changePassword(currentPw: string, nextPw: string): string | null
  completeFirstLogin(): void
  recordFor(userId: string, dateISO: string): AttendanceRecord | undefined
  checkInNow(): void
  checkOutNow(): void
  hasCheckedInToday(userId: string): boolean
  addLeaveRequest(input: { employeeId: string; employeeName: string; type: LeaveType; startDate: string; endDate: string; attachment: boolean }): void
  setLeaveStatus(id: string, status: LeaveStatus): void
  createEmployee(input: NewEmployeeInput): { user: User; tempPassword: string }
  updateResumeField(userId: string, patch: Partial<ResumeInfo>): void
  updatePrivateInfo(userId: string, patch: Partial<User>): void
  updateBankDetails(userId: string, patch: Partial<User['bankDetails']>): void
  updateSalaryConfig(userId: string, config: SalaryConfig): void
}

export const StoreContext = createContext<AppStore | null>(null)

export function useStore(): AppStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
