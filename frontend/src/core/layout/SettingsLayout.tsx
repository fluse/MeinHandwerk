import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/settings/general', label: 'Allgemein' },
  { to: '/settings/team', label: 'Team' },
  { to: '/settings/vehicles', label: 'Fahrzeuge' },
  { to: '/settings/notifications', label: 'Meldungen' },
]

export function SettingsLayout() {
  return (
    <div className="mx-auto max-w-lg pb-10">
      <h1 className="mb-3 text-lg font-bold text-ink">Einstellungen</h1>

      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-3 py-2 text-sm font-semibold no-underline ${
                isActive ? 'border-sage-deep text-sage-deep' : 'border-transparent text-muted'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
