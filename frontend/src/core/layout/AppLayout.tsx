import { Settings } from 'lucide-react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  const { user, canPlan, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-page">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <span className="truncate text-base font-semibold text-ink">Hahn Energie & Bau</span>
        {user && (
          <div className="flex flex-none items-center gap-3">
            {canPlan && (
              <Link
                to="/team"
                title="Team & Einstellungen"
                aria-label="Team & Einstellungen"
                className="text-sage-deep"
              >
                <Settings size={20} />
              </Link>
            )}
            <span className="hidden max-w-[40vw] truncate text-sm text-muted sm:inline">
              {user.email}
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Abmelden
            </Button>
          </div>
        )}
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
