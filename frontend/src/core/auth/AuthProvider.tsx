import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthRecord } from 'pocketbase'
import { pb } from '@/core/api/pocketbase'
import { canPlanRole, isRestrictedRole, type Role } from '@/core/lib/roles'

interface AuthContextValue {
  user: AuthRecord
  isAuthenticated: boolean
  role: Role | null
  /** Chef/Büro: darf planen, Team/Kunden/Projekte/Events verwalten. */
  canPlan: boolean
  /** Monteur/Helfer: eingeschränkte Sicht (z. B. keine anderen Chef-Termine). */
  restricted: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthRecord>(pb.authStore.record)

  useEffect(() => {
    return pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
  }, [])

  const logout = () => {
    pb.authStore.clear()
  }

  const role = (user?.role as Role | undefined) ?? null

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: pb.authStore.isValid,
        role,
        canPlan: canPlanRole(role),
        restricted: isRestrictedRole(role),
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
