import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicOnly } from '@/components/layout/PublicOnly'
import { SignInPage } from '@/pages/auth/SignInPage'
import { SignUpPage } from '@/pages/auth/SignUpPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { EmployeeProfilePage } from '@/pages/EmployeeProfilePage'
import { AttendancePage } from '@/pages/AttendancePage'
import { TimeOffPage } from '@/pages/TimeOffPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth/signin" element={<PublicOnly><SignInPage /></PublicOnly>} />
      <Route path="/auth/signup" element={<PublicOnly><SignUpPage /></PublicOnly>} />

      {/* Authenticated shell */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/timeoff" element={<TimeOffPage />} />
        <Route path="/profile" element={<EmployeeProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
