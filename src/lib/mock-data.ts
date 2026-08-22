// ---------------------------------------------------------------------------
// Dayflow mock data layer. All application data is mocked here — no real APIs.
// ---------------------------------------------------------------------------

export const COMPANY_NAME = 'Oidos India'

export type Role = 'admin' | 'hr' | 'employee'

export interface BankDetails {
  accountNumber: string
  bankName: string
  ifscCode: string
  panNo: string
  uanNo: string
  esiCode: string
}

export interface ResumeInfo {
  about: string
  loveAboutJob: string
  interestsHobbies: string
  skills: string[]
  certifications: string[]
}

export type ComponentType = 'fixed' | 'percentage'

export interface SalaryComponent {
  id: string
  name: string
  type: ComponentType
  value: number // amount when fixed, percent when percentage
}

export interface SalaryConfig {
  monthlyWage: number
  workingDaysPerWeek: number
  breakTimeHours: number
  components: SalaryComponent[]
  pfRate: number // percent of basic salary
  professionalTax: number // flat ₹ / month
}

export interface User {
  id: string
  loginId: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  companyName: string
  department: string
  manager: string
  mobile: string
  location: string
  avatarInitial: string
  dateOfBirth: string
  joiningDate: string // ISO yyyy-mm-dd
  nationality: string
  gender: string
  maritalStatus: string
  address: string
  personalEmail: string
  bankDetails: BankDetails
  resume: ResumeInfo
  salaryConfig: SalaryConfig
  mustChangePassword: boolean
}

export type AttendanceStatus = 'present' | 'half' | 'absent' | 'leave'

export interface AttendanceRecord {
  employeeId: string
  date: string // ISO yyyy-mm-dd
  checkIn: string | null // "09:00 AM"
  checkOut: string | null
  workHours: number
  extraHours: number
  status: AttendanceStatus
}

export type LeaveType = 'paid' | 'sick' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  days: number
  status: LeaveStatus
  attachment: boolean
  appliedOn: string
}

export type ActivityType = 'checkin' | 'leave' | 'salary' | 'profile'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  subtitle: string
  timeAgo: string
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function isWeekendISO(iso: string): boolean {
  const day = parseISO(iso).getDay()
  return day === 0 || day === 6
}

export function formatLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime12(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function addMinutesToTime12(time12: string, minutes: number): string {
  const [hm, ampm] = time12.split(' ')
  const [h, m] = hm.split(':').map(Number)
  const total = ((ampm.toUpperCase() === 'PM' && h !== 12 ? h + 12 : h % 12) * 60 + m + minutes) % (24 * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  const outAmpm = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${String(h12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${outAmpm}`
}

// Deterministic PRNG so generated history never shifts between renders.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// ---------------------------------------------------------------------------
// Login ID + temp password generation (Admin/HR create accounts)
// Format: [CompanyFirst2][First2OfFirstName][First2OfLastName][Year][4-digit serial]
// e.g. OITODO20220001
// ---------------------------------------------------------------------------

const letters = (s: string, n: number) => s.replace(/[^a-zA-Z]/g, '').slice(0, n).toUpperCase()

export function generateLoginId(
  companyName: string,
  firstName: string,
  lastName: string,
  joiningDate: string,
  existingUsers: Pick<User, 'loginId' | 'joiningDate'>[],
): string {
  const prefix = `${letters(companyName, 2)}${letters(firstName, 2)}${letters(lastName, 2)}`
  const year = parseISO(joiningDate).getFullYear().toString()
  const base = `${prefix}${year}`
  let maxSerial = 0
  for (const u of existingUsers) {
    if (u.loginId.startsWith(base) && /^\d{4}$/.test(u.loginId.slice(base.length))) {
      maxSerial = Math.max(maxSerial, Number(u.loginId.slice(base.length)))
    }
  }
  return `${base}${String(maxSerial + 1).padStart(4, '0')}`
}

export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = 'Df@'
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const defaultResume = (): ResumeInfo => ({
  about:
    'Product-minded engineer who enjoys turning messy workflows into calm, simple products. I care about clean data models, small interfaces that do one thing well, and shipping iteratively.',
  loveAboutJob:
    'The freedom to own problems end-to-end and a team that reviews ideas, not people.',
  interestsHobbies: 'Long-distance cycling, filter coffee brewing, sketching city skylines, and weekend cricket.',
  skills: [],
  certifications: [],
})

export function makeUser(partial: Partial<User> & Pick<User, 'id' | 'loginId' | 'email' | 'firstName' | 'lastName' | 'role'>): User {
  return {
    password: 'Dayflow@123',
    companyName: COMPANY_NAME,
    department: 'Engineering',
    manager: 'Aarav Mehta',
    mobile: '+91 90000 00000',
    location: 'Bengaluru, IN',
    avatarInitial: `${partial.firstName?.[0] ?? ''}${partial.lastName?.[0] ?? ''}`.toUpperCase(),
    dateOfBirth: '1995-06-15',
    joiningDate: '2022-01-10',
    nationality: 'Indian',
    gender: 'Female',
    maritalStatus: 'Single',
    address: 'HSR Layout, Bengaluru 560102',
    personalEmail: '',
    bankDetails: {
      accountNumber: 'XXXXXX4412',
      bankName: 'HDFC Bank',
      ifscCode: 'HDFC0001234',
      panNo: 'ABCPX1234F',
      uanNo: '101234567890',
      esiCode: '31000123450000999',
    },
    resume: defaultResume(),
    salaryConfig: defaultSalaryConfig(50000),
    mustChangePassword: false,
    ...partial,
  }
}

export function defaultSalaryConfig(monthlyWage: number): SalaryConfig {
  return {
    monthlyWage,
    workingDaysPerWeek: 5,
    breakTimeHours: 1,
    pfRate: 12,
    professionalTax: 200,
    components: [
      { id: 'basic', name: 'Basic Salary', type: 'percentage', value: 50 },
      { id: 'hra', name: 'House Rent Allowance (HRA)', type: 'percentage', value: 50 }, // % of Basic
      { id: 'standard', name: 'Standard Allowance', type: 'fixed', value: 3000 },
      { id: 'bonus', name: 'Performance Bonus', type: 'fixed', value: 5000 },
      { id: 'lta', name: 'Leave Travel Allowance', type: 'fixed', value: 2500 },
      { id: 'food', name: 'Food Allowance', type: 'fixed', value: 2000 },
    ],
  }
}

export const initialUsers: User[] = [
  makeUser({
    id: 'u-admin',
    loginId: 'OIAAME20180001',
    email: 'aarav.mehta@oidos.in',
    password: 'Admin@123',
    firstName: 'Aarav',
    lastName: 'Mehta',
    role: 'admin',
    department: 'People Ops',
    manager: '—',
    mobile: '+91 98450 11223',
    location: 'Bengaluru, IN',
    dateOfBirth: '1988-03-02',
    joiningDate: '2018-04-02',
    gender: 'Male',
    maritalStatus: 'Married',
    address: 'Indiranagar, Bengaluru 560038',
    personalEmail: 'aarav.m@gmail.com',
    salaryConfig: defaultSalaryConfig(120000),
    resume: {
      ...defaultResume(),
      about: 'Founding admin at Oidos India. I keep the lights on, the payroll running, and the culture healthy.',
      skills: ['HR Operations', 'Compliance', 'Payroll', 'Vendor Management'],
      certifications: ['SHRM-CP', 'Six Sigma Green Belt'],
    },
  }),
  makeUser({
    id: 'u-hr',
    loginId: 'OIPRSH20200002',
    email: 'priya.sharma@oidos.in',
    password: 'Hr@12345',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'hr',
    department: 'People Ops',
    manager: 'Aarav Mehta',
    mobile: '+91 98867 44551',
    dateOfBirth: '1991-11-19',
    joiningDate: '2020-07-20',
    address: 'Koramangala, Bengaluru 560034',
    personalEmail: 'priya.s@gmail.com',
    salaryConfig: defaultSalaryConfig(85000),
    resume: {
      ...defaultResume(),
      about: 'HR officer who believes paperwork should feel like a warm welcome, not a wall.',
      skills: ['Recruiting', 'Onboarding', 'Employee Relations'],
      certifications: ['Certified HR Generalist'],
    },
  }),
  makeUser({
    id: 'u-tom',
    loginId: 'OITODO20220001',
    email: 'tom.doe@oidos.in',
    password: 'Dayflow@123',
    firstName: 'Tom',
    lastName: 'Doe',
    role: 'employee',
    department: 'Engineering',
    manager: 'Priya Sharma',
    mobile: '+91 90080 70605',
    location: 'Bengaluru, IN',
    dateOfBirth: '1994-09-08',
    joiningDate: '2022-01-10',
    gender: 'Male',
    address: 'HSR Layout, Bengaluru 560102',
    personalEmail: 'tom.doe@gmail.com',
    salaryConfig: defaultSalaryConfig(50000),
    resume: {
      ...defaultResume(),
      about:
        'Frontend engineer focused on design systems and accessibility. Previously built dashboards at two fintech startups.',
      loveAboutJob: 'Shipping polished UI that hundreds of teammates use every single day.',
      interestsHobbies: 'Bouldering, film photography, and collecting mechanical keyboards.',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibility', 'Design Systems'],
      certifications: ['Meta Front-End Developer', 'AWS Cloud Practitioner'],
    },
  }),
  makeUser({
    id: 'u-neha',
    loginId: 'OINEVE20210003',
    email: 'neha.verma@oidos.in',
    firstName: 'Neha',
    lastName: 'Verma',
    role: 'employee',
    department: 'Design',
    manager: 'Priya Sharma',
    joiningDate: '2021-03-15',
    salaryConfig: defaultSalaryConfig(60000),
    resume: { ...defaultResume(), skills: ['Figma', 'Prototyping'], certifications: ['NN/g UX Certification'] },
  }),
  makeUser({
    id: 'u-rohan',
    loginId: 'OIROGU20220004',
    email: 'rohan.gupta@oidos.in',
    firstName: 'Rohan',
    lastName: 'Gupta',
    role: 'employee',
    department: 'Engineering',
    manager: 'Aarav Mehta',
    gender: 'Male',
    joiningDate: '2022-08-01',
    salaryConfig: defaultSalaryConfig(72000),
    resume: { ...defaultResume(), skills: ['Node.js', 'PostgreSQL'], certifications: [] },
  }),
  makeUser({
    id: 'u-sara',
    loginId: 'OISAKH20230005',
    email: 'sara.khan@oidos.in',
    firstName: 'Sara',
    lastName: 'Khan',
    role: 'employee',
    department: 'Marketing',
    manager: 'Priya Sharma',
    joiningDate: '2023-02-13',
    salaryConfig: defaultSalaryConfig(55000),
    resume: { ...defaultResume(), skills: ['SEO', 'Content Strategy'], certifications: ['HubSpot Inbound'] },
  }),
  makeUser({
    id: 'u-vikram',
    loginId: 'OIVIRA20230006',
    email: 'vikram.rao@oidos.in',
    firstName: 'Vikram',
    lastName: 'Rao',
    role: 'employee',
    department: 'Finance',
    manager: 'Aarav Mehta',
    gender: 'Male',
    joiningDate: '2023-09-04',
    salaryConfig: defaultSalaryConfig(80000),
    resume: { ...defaultResume(), skills: ['FP&A', 'SAP'], certifications: ['CFA Level II'] },
  }),
  makeUser({
    id: 'u-anita',
    loginId: 'OIANDE20240007',
    email: 'anita.desai@oidos.in',
    firstName: 'Anita',
    lastName: 'Desai',
    role: 'employee',
    department: 'Engineering',
    manager: 'Aarav Mehta',
    joiningDate: '2024-01-22',
    salaryConfig: defaultSalaryConfig(65000),
    resume: { ...defaultResume(), skills: ['Python', 'ML Ops'], certifications: ['TensorFlow Developer'] },
  }),
]

// ---------------------------------------------------------------------------
// Attendance generation — current + previous month, all employees
// ---------------------------------------------------------------------------

function randomCheckIn(rng: () => number): string {
  const minute = 55 + Math.floor(rng() * 14) // 08:55 – 09:08
  const h = 8 + Math.floor(minute / 60)
  const m = minute % 60
  return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function buildAttendance(users: User[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let back = 1; back >= 0; back--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - back, 1)
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (const user of users) {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const iso = toISO(date)
        if (date.getDay() === 0 || date.getDay() === 6) continue

        if (date.getTime() > today.getTime()) continue

        // New joiners have no history before their start date.
        if (parseISO(user.joiningDate).getTime() > date.getTime()) continue

        const rng = mulberry32(hashSeed(`${user.loginId}:${iso}`))
        const roll = rng()

        if (roll > 0.94) {
          records.push({ employeeId: user.id, date: iso, checkIn: null, checkOut: null, workHours: 0, extraHours: 0, status: 'absent' })
          continue
        }
        const half = roll > 0.86
        const checkIn = randomCheckIn(rng)
        const workHours = half ? 4 : 7.5 + rng() * 1.25
        const checkOut = addMinutesToTime12(checkIn, Math.round(workHours * 60) + 60) // includes 1h break
        records.push({
          employeeId: user.id,
          date: iso,
          checkIn,
          checkOut,
          workHours: Math.round(workHours * 10) / 10,
          extraHours: half ? 0 : Math.max(0, Math.round((workHours - 8) * 10) / 10),
          status: half ? 'half' : 'present',
        })
      }
    }
  }

  // Make "today" feel alive: every employee except the primary demo user is
  // already checked in. Approved leave overrides happen after this returns.
  const todayISO = toISO(today)
  for (const user of users) {
    if (user.id === 'u-tom') continue
    if (parseISO(user.joiningDate).getTime() > today.getTime()) continue
    let rng = mulberry32(hashSeed(`${user.loginId}:${todayISO}:today`))
    let roll = rng()
    // One deterministic absentee so the directory shows all three states.
    if (user.id === 'u-vikram') {
      rng = mulberry32(99)
      roll = 0.97
    }
    if (roll > 0.94) {
      records.push({ employeeId: user.id, date: todayISO, checkIn: null, checkOut: null, workHours: 0, extraHours: 0, status: 'absent' })
      continue
    }
    const half = roll > 0.9
    const checkIn = randomCheckIn(rng)
    const workHours = half ? 4 : 7.5 + rng() * 1.25
    const checkOut = addMinutesToTime12(checkIn, Math.round(workHours * 60) + 60)
    records.push({
      employeeId: user.id,
      date: todayISO,
      checkIn,
      checkOut,
      workHours: Math.round(workHours * 10) / 10,
      extraHours: half ? 0 : Math.max(0, Math.round((workHours - 8) * 10) / 10),
      status: half ? 'half' : 'present',
    })
  }
  return records
}

export const initialAttendance: AttendanceRecord[] = buildAttendance(initialUsers)

// ---------------------------------------------------------------------------
// Leave requests
// ---------------------------------------------------------------------------

function isoOffset(daysFromToday: number): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + daysFromToday)
  return toISO(d)
}

function weekdaysBetween(startISO: string, endISO: string): number {
  let count = 0
  const cur = parseISO(startISO)
  const end = parseISO(endISO)
  while (cur.getTime() <= end.getTime()) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

const rawLeaves: Array<Omit<LeaveRequest, 'days'>> = [
    { id: 'lv-1', employeeId: 'u-tom', employeeName: 'Tom Doe', type: 'paid', startDate: isoOffset(-14), endDate: isoOffset(-14), status: 'approved', attachment: false, appliedOn: isoOffset(-21) },
    { id: 'lv-2', employeeId: 'u-tom', employeeName: 'Tom Doe', type: 'sick', startDate: isoOffset(-7), endDate: isoOffset(-6), status: 'approved', attachment: true, appliedOn: isoOffset(-7) },
    { id: 'lv-3', employeeId: 'u-tom', employeeName: 'Tom Doe', type: 'paid', startDate: isoOffset(6), endDate: isoOffset(8), status: 'pending', attachment: false, appliedOn: isoOffset(-1) },
    { id: 'lv-4', employeeId: 'u-neha', employeeName: 'Neha Verma', type: 'unpaid', startDate: isoOffset(2), endDate: isoOffset(3), status: 'pending', attachment: false, appliedOn: isoOffset(-2) },
    { id: 'lv-5', employeeId: 'u-rohan', employeeName: 'Rohan Gupta', type: 'paid', startDate: isoOffset(1), endDate: isoOffset(5), status: 'approved', attachment: false, appliedOn: isoOffset(-4) },
    { id: 'lv-6', employeeId: 'u-sara', employeeName: 'Sara Khan', type: 'sick', startDate: isoOffset(-3), endDate: isoOffset(-2), status: 'rejected', attachment: true, appliedOn: isoOffset(-3) },
    { id: 'lv-7', employeeId: 'u-anita', employeeName: 'Anita Desai', type: 'paid', startDate: isoOffset(0), endDate: isoOffset(0), status: 'approved', attachment: false, appliedOn: isoOffset(-9) },
    { id: 'lv-8', employeeId: 'u-vikram', employeeName: 'Vikram Rao', type: 'paid', startDate: isoOffset(-10), endDate: isoOffset(-10), status: 'approved', attachment: false, appliedOn: isoOffset(-16) },
]

export const initialLeaveRequests: LeaveRequest[] = rawLeaves.map((l) => ({
  ...l,
  days: weekdaysBetween(l.startDate, l.endDate),
}))

// Approved leaves become full-day 'leave' attendance entries.
for (const lv of initialLeaveRequests) {
  if (lv.status !== 'approved') continue
  const cur = parseISO(lv.startDate)
  const end = parseISO(lv.endDate)
  while (cur.getTime() <= end.getTime()) {
    const iso = toISO(cur)
    if (!isWeekendISO(iso)) {
      const existing = initialAttendance.find((r) => r.employeeId === lv.employeeId && r.date === iso)
      if (existing) {
        existing.status = 'leave'
        existing.checkIn = null
        existing.checkOut = null
        existing.workHours = 0
        existing.extraHours = 0
      } else {
        initialAttendance.push({ employeeId: lv.employeeId, date: iso, checkIn: null, checkOut: null, workHours: 0, extraHours: 0, status: 'leave' })
      }
    }
    cur.setDate(cur.getDate() + 1)
  }
}

// ---------------------------------------------------------------------------
// Leave balances (per employee, simple annual allocation)
// ---------------------------------------------------------------------------

export interface LeaveBalance {
  total: number
  paid: number
  sick: number
  unpaid: number
}

export function computeLeaveBalance(userId: string, leaves: LeaveRequest[]): LeaveBalance {
  const usedDays = (type: LeaveType) =>
    leaves
      .filter((l) => l.employeeId === userId && l.type === type && l.status !== 'rejected')
      .reduce((sum, l) => sum + l.days, 0)

  const paid = Math.max(0, 18 - usedDays('paid'))
  const sick = Math.max(0, 7 - usedDays('sick'))
  return { total: paid + sick, paid, sick, unpaid: usedDays('unpaid') }
}

// ---------------------------------------------------------------------------
// Payroll math
// ---------------------------------------------------------------------------

export interface ComputedComponent {
  id: string
  name: string
  type: ComponentType
  value: number
  amount: number
}

/**
 * Percentage components resolve against Monthly Wage for the first component
 * marked as basic-like (Basic Salary) and against the computed Basic amount
 * thereafter — matching the spec example: wage ₹50,000, Basic 50% → ₹25,000,
 * HRA 50% of Basic → ₹12,500.
 */
export function computeComponents(config: SalaryConfig): ComputedComponent[] {
  const basicComponent = config.components.find((c) => c.name.toLowerCase().includes('basic'))
  const basicAmount = basicComponent
    ? basicComponent.type === 'fixed'
      ? basicComponent.value
      : (config.monthlyWage * basicComponent.value) / 100
    : config.monthlyWage

  return config.components.map((c) => ({
    ...c,
    amount:
      c.type === 'fixed'
        ? c.value
        : c === basicComponent
          ? (config.monthlyWage * c.value) / 100
          : (basicAmount * c.value) / 100,
  }))
}

export function computeDeductions(config: SalaryConfig, basicAmount: number) {
  const pfEmployee = (basicAmount * config.pfRate) / 100
  return {
    pfEmployee: Math.round(pfEmployee),
    pfEmployer: Math.round(pfEmployee),
    professionalTax: config.professionalTax,
    total: Math.round(pfEmployee * 2 + config.professionalTax),
  }
}

export function grossTotal(components: ComputedComponent[]): number {
  return Math.round(components.reduce((s, c) => s + c.amount, 0))
}

/**
 * Payable days = working days (Mon–Fri) in the month, minus unpaid-leave days,
 * minus missing attendance days (no record at all on a past working day).
 * Paid/sick approved leaves remain payable.
 */
export function computePayableDays(
  employee: Pick<User, 'id' | 'joiningDate'>,
  year: number,
  monthIndex: number,
  attendance: AttendanceRecord[],
  leaves: LeaveRequest[],
): { payableDays: number; workingDays: number; unpaidLeaveDays: number; missingDays: number } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const joining = parseISO(employee.joiningDate)

  let workingDays = 0
  let unpaidLeaveDays = 0
  let missingDays = 0

  const unpaidDates = new Set<string>()
  for (const lv of leaves) {
    if (lv.employeeId === employee.id && lv.status === 'approved' && lv.type === 'unpaid') {
      const cur = parseISO(lv.startDate)
      const end = parseISO(lv.endDate)
      while (cur.getTime() <= end.getTime()) {
        unpaidDates.add(toISO(cur))
        cur.setDate(cur.getDate() + 1)
      }
    }
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue
    if (date.getTime() < joining.getTime()) continue
    if (date.getTime() > today.getTime()) continue
    workingDays++

    const iso = toISO(date)
    if (unpaidDates.has(iso)) {
      unpaidLeaveDays++
      continue
    }
    const rec = attendance.find((r) => r.employeeId === employee.id && r.date === iso)
    if (!rec || rec.status === 'absent') missingDays++
  }

  return { payableDays: Math.max(0, workingDays - unpaidLeaveDays - missingDays), workingDays, unpaidLeaveDays, missingDays }
}

// ---------------------------------------------------------------------------
// Dashboard bits
// ---------------------------------------------------------------------------

export const activities: Activity[] = [
  { id: 'ac-1', type: 'checkin', title: 'Checked in', subtitle: 'You checked in at office', timeAgo: 'Just now' },
  { id: 'ac-2', type: 'leave', title: 'Leave approved', subtitle: 'Paid time off · 3 days', timeAgo: '2h ago' },
  { id: 'ac-3', type: 'salary', title: 'Salary processed', subtitle: 'Payslip for last month is ready', timeAgo: '1d ago' },
  { id: 'ac-4', type: 'profile', title: 'Profile updated', subtitle: 'Bank details verified by HR', timeAgo: '3d ago' },
]
