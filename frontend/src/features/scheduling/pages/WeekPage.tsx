import { CalendarClock, ChevronRight, ListChecks, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { colorVar } from '@/core/lib/cssVar'
import { addDays, iso, fmtShort } from '@/core/lib/date'
import { WD } from '@/core/lib/time'
import { surname, shortAddr } from '@/core/lib/format'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrders } from '../hooks/useOrders'
import { useWeekStart } from '../hooks/useWeekStart'
import { WeekNav } from '../components/WeekNav'
import { TradeIcon } from '../components/TradeBadge'
import { TRADES, TRADE_VALUES } from '../types/order'

export function WeekPage() {
  const { restricted } = useAuth()
  const { weekStart, setWeekStart } = useWeekStart()
  const { data: roster = [] } = useRoster()
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const { data: orders = [], isLoading } = useOrders(iso(weekStart), iso(weekDates[6]))

  const chefHidden = (role: string) => restricted && role === 'chef'
  const week = iso(weekStart)

  return (
    <div>
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-ink">Wochenübersicht</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/auftraege"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-sage-deep no-underline"
            >
              <ListChecks size={14} /> Liste
            </Link>
            <Link
              to={`/schedule?date=${week}`}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-sage-deep no-underline"
            >
              <CalendarClock size={14} /> Tagesansicht
            </Link>
          </div>
        </div>
      </div>
      <div>
        <WeekNav weekStart={weekStart} onChange={setWeekStart} days={7} />
      </div>

      {isLoading ? (
        <p className="mt-4 px-4 text-sm text-muted sm:px-6">Aufträge werden geladen…</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <div
            className="grid w-fit"
            style={{
              gridTemplateColumns: `56px repeat(${roster.length}, minmax(112px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 border-b border-r border-border bg-sage" />
            {roster.map((m) => {
              const hidden = chefHidden(m.role)
              return hidden ? (
                <div
                  key={m.id}
                  className="flex flex-col items-center justify-center gap-1 border-b border-r border-border bg-[#9AA0A6] p-1.5 text-white"
                >
                  <span className="text-center text-xs font-bold leading-tight">{m.name}</span>
                  <Lock size={11} className="opacity-85" />
                </div>
              ) : (
                <Link
                  key={m.id}
                  to={`/week/${m.id}?week=${week}`}
                  className="flex flex-col items-center justify-center gap-1 border-b border-r border-border bg-sage p-1.5 text-white no-underline"
                >
                  <span className="text-center text-xs font-bold leading-tight">{m.name}</span>
                  <span className="flex items-center text-[9px] font-semibold opacity-85">
                    Woche <ChevronRight size={10} />
                  </span>
                </Link>
              )
            })}

            {weekDates.map((d, di) => {
              const dIso = iso(d)
              return (
                <div key={dIso} className="contents">
                  <Link
                    to={`/schedule?date=${dIso}`}
                    className="sticky left-0 z-20 flex min-h-14 flex-col items-center justify-center border-b border-r border-border bg-page p-1 no-underline hover:bg-sage/15"
                  >
                    <span className="text-xs font-extrabold text-sage-deep">{WD[di]}</span>
                    <span className="text-[10px] text-muted">{fmtShort(d)}</span>
                  </Link>
                  {roster.map((m) => {
                    if (chefHidden(m.role)) {
                      return (
                        <div
                          key={m.id + dIso}
                          className="min-h-14 border-b border-r border-border bg-[#DFE2DC]"
                        />
                      )
                    }
                    const dayOrders = orders.filter(
                      (o) => o.date === dIso && o.assigned.includes(m.id),
                    )
                    return (
                      <Link
                        key={m.id + dIso}
                        to={`/schedule?date=${dIso}`}
                        className="block min-h-14 border-b border-r border-border bg-card p-1 align-top no-underline"
                      >
                        {dayOrders.map((o) => (
                          <div
                            key={o.id}
                            className="mb-0.5 rounded-md px-1.5 py-1 text-[10.5px] leading-tight"
                            style={{
                              background: colorVar(`trade-${o.trade}`),
                              color: colorVar(`trade-${o.trade}-fg`),
                              opacity: o.status === 'erledigt' ? 0.55 : 1,
                            }}
                          >
                            <div className="truncate font-bold">{surname(o.client) || o.title}</div>
                            <div className="truncate opacity-90">{shortAddr(o.address)}</div>
                          </div>
                        ))}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6">
        <div className="mt-3.5 flex flex-wrap gap-2.5 text-xs text-muted">
          {TRADE_VALUES.map((trade) => (
            <span key={trade} className="inline-flex items-center gap-1">
              <TradeIcon trade={trade} size={13} />
              {TRADES[trade]}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Tipp: Auf ein <b>Datum</b> oder eine <b>Zelle</b> tippen öffnet den Einsatzplan für alle
          Mitarbeiter an diesem Tag. Auf einen <b>Namen</b> tippen zeigt die Woche nur für diesen
          Mitarbeiter.
        </p>
      </div>
    </div>
  )
}
