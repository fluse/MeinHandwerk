import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
