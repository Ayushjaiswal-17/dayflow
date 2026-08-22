// Typed client for the Dayflow Go backend (api/).
// Same-origin by default: Vite dev proxy or nginx `/api` → api container.
// Set VITE_API_BASE to target a remote host explicitly.

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? ''
const TOKEN_KEY = 'dayflow.token'

export interface ApiEmployee {
  id: string
  company_id: string
  manager_id?: string | null
  login_id: string
  email: string
  must_reset_password: boolean
  first_name: string
  last_name: string
  phone?: string | null
  profile_picture_url?: string | null
  role: 'admin' | 'hr_officer' | 'employee'
  department?: string | null
  designation?: string | null
  employment_status: string
  date_of_birth?: string | null
  date_of_joining?: string | null
  address?: string | null
  about?: string | null
  company_name?: string
  company_code?: string
  manager_name?: string
}

export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('API unreachable', 0)
  }

  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>
  if (!res.ok || body.success === false) {
    throw new ApiError(body.message || body.error || `Request failed (${res.status})`, res.status)
  }
  return body.data as T
}

/* ---------- Auth ---------- */

export interface AuthResult {
  token: string
  must_reset_password: boolean
  employee: ApiEmployee
}

export function apiLogin(identifier: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

export function apiGetMe(): Promise<ApiEmployee> {
  return request<ApiEmployee>('/api/v1/auth/me')
}

export function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  return request<void>('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

/* ---------- Employees ---------- */

export function apiListEmployees(): Promise<ApiEmployee[]> {
  return request<ApiEmployee[]>('/api/v1/employees')
}

/* ---------- Attendance ---------- */

export interface ApiAttendanceRecord {
  id: string
  employee_id: string
  work_date: string
  check_in: string | null
  check_out: string | null
  work_hours: number
  extra_hours: number
  status: string
  employee_name?: string
}

function monthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

export function apiGetMyAttendance(): Promise<ApiAttendanceRecord[]> {
  const { start, end } = monthRange()
  return request<ApiAttendanceRecord[]>(
    `/api/v1/attendance/my?start_date=${start}&end_date=${end}`,
  )
}

export function apiCheckIn(): Promise<ApiAttendanceRecord> {
  return request<ApiAttendanceRecord>('/api/v1/attendance/check-in', { method: 'POST', body: '{}' })
}

export function apiCheckOut(): Promise<ApiAttendanceRecord> {
  return request<ApiAttendanceRecord>('/api/v1/attendance/check-out', { method: 'POST', body: '{}' })
}

/* ---------- Time off ---------- */

export interface ApiTimeOffRequest {
  id: string
  employee_id: string
  time_off_type_name?: string
  employee_name?: string
  start_date: string
  end_date: string
  days_requested: number
  remarks?: string | null
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewer_name?: string
}

export function apiListMyRequests(): Promise<ApiTimeOffRequest[]> {
  return request<ApiTimeOffRequest[]>('/api/v1/timeoff/requests')
}

export function apiCreateRequest(input: {
  time_off_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  remarks?: string
}): Promise<ApiTimeOffRequest> {
  return request<ApiTimeOffRequest>('/api/v1/timeoff/requests', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function apiReviewRequest(
  id: string,
  status: 'approved' | 'rejected',
  review_comments?: string,
): Promise<ApiTimeOffRequest> {
  return request<ApiTimeOffRequest>(`/api/v1/timeoff/requests/${id}/review`, {
    method: 'PATCH',
    body: JSON.stringify({ status, review_comments }),
  })
}

export function apiListLeaveTypes(): Promise<
  Array<{ id: string; name: string; is_paid: boolean; requires_attachment: boolean }>
> {
  return request('/api/v1/timeoff/types')
}
