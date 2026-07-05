import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Calendar,
  Car,
  Clock,
  Flag,
  Folder,
  ListChecks,
  type LucideIcon,
  MoreHorizontal,
  Pin,
  Users,
} from 'lucide-react'

interface Tab {
  to: string
  label: string
  icon: LucideIcon
  match: (pathname: string) => boolean
}

// Die 6 Haupt-Tabs aus MIGRATIONSPLAN.md Abschnitt 4 (analog TABS/NAVMAP der Vorlage).
// "Team" ist – wie in der Vorlage – bewusst kein Bottom-Tab, sondern ein Icon im
// Header (siehe AppLayout).
// Nur die ersten PRIMARY_COUNT Tabs stehen direkt in der Bottom Nav, der Rest
// landet gesammelt hinter dem "Mehr"-Tab – so bleibt die Leiste auch bei
// weiteren Menüpunkten mobil-tauglich.
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
  { to: '/vehicles', label: 'Fahrzeuge', icon: Car, match: (p) => p.startsWith('/vehicles') },
  {
    to: '/auftraege',
    label: 'Aufträge',
    icon: ListChecks,
    match: (p) => p.startsWith('/auftraege'),
  },
]

const PRIMARY_COUNT = 4
const primaryTabs = TABS.slice(0, PRIMARY_COUNT)
const moreTabs = TABS.slice(PRIMARY_COUNT)

export function BottomNav() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = moreTabs.some((tab) => tab.match(pathname))

  return (
    <>
      <nav
        className="sticky bottom-0 z-20 border-t border-border bg-card"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg">
          {primaryTabs.map((tab) => (
            <NavTab key={tab.to} tab={tab} active={tab.match(pathname)} />
          ))}
          {moreTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-current={moreActive ? 'page' : undefined}
              className="flex flex-1 flex-col items-center py-1.5"
            >
              <span
                className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-[11px] font-semibold transition-colors ${
                  moreActive ? 'bg-page text-sage-deep' : 'text-muted'
                }`}
              >
                <MoreHorizontal size={22} strokeWidth={moreActive ? 2.2 : 1.8} />
                Mehr
              </span>
            </button>
          )}
        </div>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-card p-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-border" />
            <div className="grid grid-cols-3 gap-2.5">
              {moreTabs.map((tab) => {
                const active = tab.match(pathname)
                const Icon = tab.icon
                return (
                  <Link
                    key={tab.to}
                    to={tab.to}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-xs font-semibold no-underline transition-colors ${
                      active ? 'bg-page text-sage-deep' : 'text-muted'
                    }`}
                  >
                    <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                    {tab.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavTab({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon
  return (
    <Link
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
}
