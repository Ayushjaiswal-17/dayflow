import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useStore } from '@/lib/store-context'
import { TopNav } from './TopNav'

export function AppLayout() {
  const { currentUser } = useStore()
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (!currentUser) return <Navigate to="/auth/signin" replace />

  return (
    <div className="product-shell min-h-screen bg-cream">
      <TopNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  )
}
