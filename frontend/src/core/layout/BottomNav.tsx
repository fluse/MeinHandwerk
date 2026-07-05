import { Link, useLocation } from 'react-router-dom'
import { Calendar, Clock, Flag, Folder, type LucideIcon, Pin, Users } from 'lucide-react'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

// Die 6 Haupt-Tabs aus MIGRATIONSPLAN.md Abschnitt 4 (analog TABS/NAVMAP der Vorlage).
// "Team" ist – wie in der Vorlage – bewusst kein Bottom-Tab, sondern ein Icon im
// Header (siehe AppLayout).
const TABS: Tab[] = [
  {
    to: '/',
    label: 'Kalender',
    icon: Calendar,
    match: (p) => p === '/' || p.startsWith('/week') || p.startsWith('/orders'),
  },
  { to: '/projects', label: 'Projekte', icon: Folder, match: (p) => p.startsWith('/projects') },
  {
    to: '/timetracking',
    label: 'Zeiten',
    icon: Clock,
    match: (p) => p.startsWith('/timetracking'),
  },
  { to: '/customers', label: 'Kunden', icon: Users, match: (p) => p.startsWith('/customers') },
  { to: '/pinboard', label: 'Pinnwand', icon: Pin, match: (p) => p.startsWith('/pinboard') },
  { to: '/events', label: 'Events', icon: Flag, match: (p) => p.startsWith('/events') },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          const Icon = tab.icon
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className="flex flex-1 flex-col items-center py-1.5 no-underline"
            >
              <span
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-[11px] font-semibold transition-colors ${
                  active ? 'bg-page text-sage-deep' : 'text-muted'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
