import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '@/lib/store'

export function PublicOnly({ children }: { children: ReactNode }) {
  const { currentUser } = useStore()
  if (currentUser) return <Navigate to="/" replace />
  return <>{children}</>
}
