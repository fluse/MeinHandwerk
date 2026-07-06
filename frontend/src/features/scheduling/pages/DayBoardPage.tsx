import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarRange, ListChecks, Lock, Plus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { Overlay } from '@/core/components/Overlay'
import { RoleIcon } from '@/core/components/RoleIcon'
import { colorVar } from '@/core/lib/cssVar'
import { iso, mondayOf, todayISO } from '@/core/lib/date'
import { blockOf, DAY_END_HOUR, DAY_START_HOUR, formatHour, PIXELS_PER_HOUR } from '@/core/lib/time'
import { surname } from '@/core/lib/format'
import { layoutTimeline } from '@/core/lib/calendarLayout'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrders } from '../hooks/useOrders'
import { useSelectedDate } from '../hooks/useSelectedDate'
import { useDeleteOrder, useSetOrderTime } from '../hooks/useOrderMutations'
import { DayNav } from '../components/DayNav'
import { TimelineBlock } from '../components/TimelineBlock'
import { OrderCard } from '../components/OrderCard'
import { NotifySheet } from '../components/NotifySheet'
import { CompleteOrderDialog } from '../components/CompleteOrderDialog'
import { TradeIcon } from '../components/TradeBadge'
import { TRADES, TRADE_VALUES, type Order } from '../types/order'

const H0 = DAY_START_HOUR
const H1 = DAY_END_HOUR
const PPH = PIXELS_PER_HOUR
// Ein paar Pixel Puffer oben: die Stunden-Labels sitzen zentriert auf der Gitterlinie und ragen
// dadurch leicht über top:0 hinaus (z. B. -6px bei der ersten Stunde). Ohne diesen Puffer entsteht
// dort echter (Mini-)Overflow, der zusammen mit overflow-x-auto einen zweiten, ungewollten
// vertikalen Scrollbalken auf der Board-Box erzeugt (Browser koppeln overflow-x/-y intern).
const TIMELINE_PAD = 8
const TOTAL_HEIGHT = (H1 - H0) * PPH
const COLUMN_HEIGHT = TOTAL_HEIGHT + TIMELINE_PAD
const COL_CLASS = 'min-w-[150px] flex-1'

export function DayBoardPage() {
  const navigate = useNavigate()
  const { user, canPlan, restricted } = useAuth()
  const { data: roster = [] } = useRoster()
  const { date, setDate } = useSelectedDate()
  const { data: orders = [], isLoading } = useOrders(date, date)
  const setOrderTime = useSetOrderTime()
  const deleteOrder = useDeleteOrder()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [notifyOrder, setNotifyOrder] = useState<Order | null>(null)
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null)

  const chefHidden = (role: string) => restricted && role === 'chef'
  const week = iso(mondayOf(new Date(`${date}T00:00:00`)))
  const hours = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i)
  const isToday = date === todayISO()
  const now = new Date()
  const nowHour = now.getHours() + now.getMinutes() / 60

  const columns = roster.map((m) => {
    const hidden = chefHidden(m.role)
    const dayOrders = hidden ? [] : orders.filter((o) => o.assigned.includes(m.id))
    const noTime = dayOrders.filter((o) => blockOf(o.from) < 0)
    const timedOrders = dayOrders.filter((o) => blockOf(o.from) >= 0)
    const timeline = layoutTimeline(timedOrders, (o) => ({ from: o.from, to: o.to }))
    return { member: m, hidden, noTime, timeline }
  })
  const anyNoTime = columns.some((c) => c.noTime.length > 0)

  const timelineRowRef = useRef<HTMLDivElement>(null)
  const [timelineWidth, setTimelineWidth] = useState(0)

  useLayoutEffect(() => {
    const el = timelineRowRef.current
    if (!el) return
    const measure = () => setTimelineWidth(el.scrollWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [columns.length])

  return (
    <div>
      <div className="px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-ink">Tagesübersicht</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/auftraege"
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-sage-deep no-underline"
            >
              <ListChecks size={14} /> Liste
            </Link>
            <Link
              to={`/week?week=${week}`}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-sage-deep no-underline"
            >
              <CalendarRange size={14} /> Wochenübersicht
            </Link>
          </div>
        </div>
      </div>
      <div>
        <DayNav date={date} onChange={setDate} />
      </div>

      {isLoading ? (
        <p className="mt-4 px-4 text-sm text-muted sm:px-6">Aufträge werden geladen…</p>
      ) : roster.length === 0 ? (
        <p className="mt-4 px-4 text-sm text-muted sm:px-6">Noch keine Mitarbeiter im Team.</p>
      ) : (
        <div className="mt-3 overflow-x-auto overflow-y-hidden border-y border-border">
          <div className="flex w-fit">
            <div className="sticky left-0 z-20 w-11 flex-none border-b border-border bg-page" />
            {columns.map(({ member: m, hidden }) =>
              hidden ? (
                <div
                  key={m.id}
                  className={`flex ${COL_CLASS} flex-col items-center justify-center gap-1 border-b border-l border-border bg-[#9AA0A6] p-2 text-white`}
                >
                  <RoleIcon role={m.role} size={24} />
                  <span className="text-center text-xs font-bold leading-tight">{m.name}</span>
                  <Lock size={11} className="opacity-85" />
                </div>
              ) : (
                <div
                  key={m.id}
                  className={`relative flex ${COL_CLASS} flex-col items-center gap-1 border-b border-l border-border bg-sage p-2 text-white`}
                >
                  <Link
                    to={`/week/${m.id}?week=${week}`}
                    className="flex flex-col items-center gap-1 text-white no-underline"
                  >
                    <span className="text-left text-xs font-bold leading-tight">{m.name}</span>
                  </Link>
                  {canPlan && (
                    <Link
                      to={`/orders/new?date=${date}&assigned=${m.id}`}
                      title="Auftrag hinzufügen"
                      aria-label="Auftrag hinzufügen"
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
                    >
                      <Plus size={12} />
                    </Link>
                  )}
                </div>
              ),
            )}
          </div>

          {anyNoTime && (
            <div className="flex w-fit border-b border-border">
              <div className="sticky left-0 z-20 flex w-11 flex-none items-start justify-end bg-page pt-1 pr-1 text-right text-[9px] leading-tight font-semibold text-muted">
                ohne Zeit
              </div>
              {columns.map(({ member: m, hidden, noTime }) => (
                <div key={m.id} className={`${COL_CLASS} border-l border-border p-1`}>
                  {!hidden &&
                    noTime.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="mb-1 block w-full cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-bold"
                        style={{
                          background: colorVar(`trade-${o.trade}`),
                          color: colorVar(`trade-${o.trade}-fg`),
                        }}
                      >
                        {surname(o.client) || o.title}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}

          <div className="relative flex w-fit" ref={timelineRowRef}>
            <div className="sticky left-0 z-20 w-11 flex-none bg-page" style={{ height: COLUMN_HEIGHT }}>
              <div className="relative" style={{ top: TIMELINE_PAD, height: TOTAL_HEIGHT }}>
                {hours.map((h) => (
                  <span
                    key={h}
                    className="absolute right-1.5 text-[10px] text-muted"
                    style={{ top: (h - H0) * PPH - 6 }}
                  >
                    {h}:00
                  </span>
                ))}
              </div>
            </div>
            {columns.map(({ member: m, hidden, timeline }) =>
              hidden ? (
                <div
                  key={m.id}
                  className={`${COL_CLASS} border-l border-border bg-[#DFE2DC]`}
                  style={{ height: COLUMN_HEIGHT }}
                />
              ) : (
                <div
                  key={m.id}
                  className={`relative ${COL_CLASS} border-l border-border bg-card`}
                  style={{ height: COLUMN_HEIGHT }}
                >
                  <div className="relative" style={{ top: TIMELINE_PAD, height: TOTAL_HEIGHT }}>
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute right-0 left-0 border-t border-border"
                        style={{ top: (h - H0) * PPH }}
                      />
                    ))}
                    {timeline.length === 0 && (
                      <div className="absolute top-2 left-1 text-[10px] text-[#B9C0B0]">frei</div>
                    )}
                    {timeline.map((entry) => (
                      <TimelineBlock
                        key={entry.item.id}
                        entry={entry}
                        pixelsPerHour={PPH}
                        dayStartHour={H0}
                        dayEndHour={H1}
                        canResize={canPlan}
                        onClick={() => setSelectedOrder(entry.item)}
                        onResize={(newEnd) =>
                          setOrderTime.mutate({
                            id: entry.item.id,
                            from: entry.item.from,
                            to: formatHour(newEnd, H0, H1),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ),
            )}
            {isToday && nowHour >= H0 && nowHour <= H1 && (
              <div
                className="pointer-events-none absolute left-0 z-10 border-t-2 border-danger"
                style={{ top: (nowHour - H0) * PPH + TIMELINE_PAD, width: timelineWidth || '100%' }}
              >
                <span className="absolute -top-2 left-1 rounded bg-danger px-1 text-[9px] font-bold text-white">
                  {formatHour(nowHour, H0, H1)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2.5 px-4 text-xs text-muted sm:px-6">
        {TRADE_VALUES.map((trade) => (
          <span key={trade} className="inline-flex items-center gap-1">
            <TradeIcon trade={trade} size={13} />
            {TRADES[trade]}
          </span>
        ))}
      </div>

      {selectedOrder && (
        <Overlay
          variant="sheet"
          responsive
          bare
          panelClassName="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card sm:rounded-2xl"
          onBackdropClick={() => setSelectedOrder(null)}
        >
          <OrderCard
            order={selectedOrder}
            roster={roster}
            currentUserId={user?.id ?? ''}
            canPlan={canPlan}
            isOpen
            onToggle={() => setSelectedOrder(null)}
            onEdit={() => navigate(`/orders/${selectedOrder.id}/edit`)}
            onDelete={() => {
              deleteOrder.mutate(selectedOrder.id)
              setSelectedOrder(null)
            }}
            onNotify={() => {
              setNotifyOrder(selectedOrder)
              setSelectedOrder(null)
            }}
            onComplete={() => {
              setCompleteOrder(selectedOrder)
              setSelectedOrder(null)
            }}
            onRapport={() => navigate(`/orders/${selectedOrder.id}/rapports`)}
          />
        </Overlay>
      )}

      {notifyOrder && (
        <NotifySheet order={notifyOrder} members={roster} onClose={() => setNotifyOrder(null)} />
      )}
      {completeOrder && (
        <CompleteOrderDialog
          order={completeOrder}
          currentUserId={user?.id ?? ''}
          onClose={() => setCompleteOrder(null)}
        />
      )}
    </div>
  )
}
