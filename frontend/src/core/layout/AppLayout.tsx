import { LogOut, Settings } from 'lucide-react'
import { Link, Outlet, useMatches, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { useCompanySettings } from '@/features/settings/hooks/useCompanySettings'
import { BottomNav } from './BottomNav'

type RouteHandle = { fullBleed?: boolean }

export function AppLayout() {
  const { user, canPlan, logout } = useAuth()
  const { data: companySettings } = useCompanySettings()
  const navigate = useNavigate()
  const matches = useMatches()
  const fullBleed = matches.some((match) => (match.handle as RouteHandle | undefined)?.fullBleed)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 truncate text-base font-semibold text-ink no-underline"
        >
          {companySettings?.logoUrl && (
            <img
              src={companySettings.logoUrl}
              alt=""
              className="h-7 w-7 flex-none object-contain"
            />
          )}
          <span className="truncate">{companySettings?.companyName ?? 'MeinHandwerk'}</span>
        </Link>
        {user && (
          <div className="flex flex-none items-center gap-3">
            {canPlan && (
              <Link
                to="/settings"
                title="Einstellungen"
                aria-label="Einstellungen"
                className="text-sage-deep"
              >
                <Settings size={20} />
              </Link>
            )}
            <span className="hidden max-w-[40vw] truncate text-sm text-muted sm:inline">
              {user.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Abmelden"
              aria-label="Abmelden"
              className="cursor-pointer text-sage-deep hover:text-danger"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </header>
      <main className={fullBleed ? 'flex-1' : 'flex-1 p-4 sm:p-6'}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
