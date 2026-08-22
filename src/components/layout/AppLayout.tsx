import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store'
import { TopNav } from './TopNav'

export function AppLayout() {
  const { currentUser } = useStore()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!currentUser) return <Navigate to="/auth/signin" replace />

  return (
    <div className="min-h-screen bg-cream">
      <TopNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
