import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import type { Role } from '@/core/lib/roles'

/** Sperrt chef/büro-only-Routen für monteur/helfer; setzt eine gültige Session voraus (ProtectedRoute davor). */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { role } = useAuth()

  if (!role || !allow.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
