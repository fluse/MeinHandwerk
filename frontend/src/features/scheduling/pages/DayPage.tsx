import { useRef, useState } from 'react'
import { ChevronLeft, Lock, Plus } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { RoleIcon } from '@/core/components/RoleIcon'
import { colorVar } from '@/core/lib/cssVar'
import { fmtLong } from '@/core/lib/date'
import { BLOCKS, blockOf } from '@/core/lib/time'
import { surname } from '@/core/lib/format'
import { layoutTimeline } from '@/core/lib/calendarLayout'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrders } from '../hooks/useOrders'
import { useSetOrderTime, useDeleteOrder } from '../hooks/useOrderMutations'
import { OrderCard } from '../components/OrderCard'
import { NotifySheet } from '../components/NotifySheet'
import { CompleteOrderDialog } from '../components/CompleteOrderDialog'
import type { Order } from '../types/order'

const PPH = 46
const H0 = 6
const H1 = 20

function hm(f: number): string {
  const clamped = Math.max(H0, Math.min(H1, f))
  let h = Math.floor(clamped)
  let m = Math.round((clamped - h) * 60)
  if (m === 60) {
    h++
    m = 0
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface DragState {
  id: string
  from: string
  start: number
  startY: number
  startEnd: number
  curEnd: number
}

export function DayPage() {
  const { userId, date } = useParams<{ userId: string; date: string }>()
  const [searchParams] = useSearchParams()
  const week = searchParams.get('week')
  const navigate = useNavigate()
  const { user, canPlan, restricted } = useAuth()
  const { data: roster = [] } = useRoster()
  const { data: orders = [] } = useOrders(date ?? '', date ?? '')
  const setOrderTime = useSetOrderTime()
  const deleteOrder = useDeleteOrder()

  const [openIds, setOpenIds] = useState<string[]>([])
  const [notifyOrder, setNotifyOrder] = useState<Order | null>(null)
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null)
  const [resize, setResize] = useState<{ id: string; endH: number } | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const member = roster.find((m) => m.id === userId)
  const toggleOpen = (id: string) =>
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  if (!member || !date) return <p className="text-sm text-muted">Wird geladen…</p>

  const hidden = restricted && member.role === 'chef'
  const backHref = `/week/${member.id}?week=${week ?? ''}`

  if (hidden) {
    return (
      <div>
        <h1 className="mb-4 text-lg font-bold text-ink">{member.name}</h1>
        <div className="rounded-2xl bg-[#DFE2DC] p-10 text-center text-sage-text">
          <Lock size={32} className="mx-auto mb-2" />
          <div className="text-sm font-bold">Dieser Kalender ist nicht sichtbar</div>
        </div>
      </div>
    )
  }

  const dayOrders = orders.filter((o) => o.assigned.includes(member.id))
  const noTime = dayOrders.filter((o) => blockOf(o.from) < 0)
  const timeline = layoutTimeline(dayOrders, (o) => ({ from: o.from, to: o.to }))
  const hours = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i)

  const newOrderHref = (from?: string, to?: string) => {
    const params = new URLSearchParams({ date, assigned: member.id })
    if (week) params.set('week', week)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    return `/orders/new?${params.toString()}`
  }

  const renderCards = (list: Order[]) =>
    list.length === 0 ? (
      <div className="pb-1 text-xs text-muted">Keine Aufträge</div>
    ) : (
      list.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          roster={roster}
          currentUserId={user?.id ?? ''}
          canPlan={canPlan}
          isOpen={openIds.includes(o.id)}
          onToggle={() => toggleOpen(o.id)}
          onEdit={() => navigate(`/orders/${o.id}/edit?week=${week ?? ''}`)}
          onDelete={() => deleteOrder.mutate(o.id)}
          onNotify={() => setNotifyOrder(o)}
          onComplete={() => setCompleteOrder(o)}
          onRapport={() => navigate(`/orders/${o.id}/rapports`)}
        />
      ))
    )

  return (
    <div className="mx-auto max-w-lg pb-16">
      <button
        type="button"
        onClick={() => navigate(backHref)}
        className="mb-2 flex items-center text-xs font-semibold text-sage-deep"
      >
        <ChevronLeft size={14} /> zurück zur Woche
      </button>
      <div className="mb-3 flex items-center gap-2">
        <RoleIcon role={member.role} size={22} />
        <div className="text-sm font-bold capitalize text-sage-text">{fmtLong(date)}</div>
      </div>

      <div className="mb-1 text-[11px] font-extrabold text-muted">
        ZEITSTRAHL{canPlan ? ' · Block unten ziehen zum Anpassen' : ''}
      </div>
      <div className="relative mb-4" style={{ height: (H1 - H0) * PPH + 2 }}>
        {hours.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border"
            style={{ top: (h - H0) * PPH }}
          >
            <span className="absolute -top-1.5 left-0 w-9 text-right text-[10px] text-muted">
              {h}:00
            </span>
          </div>
        ))}
        <div className="absolute bottom-0 left-11 right-1.5 top-0">
          {timeline.length === 0 && (
            <div className="absolute left-1 top-2 text-xs text-[#B9C0B0]">
              Keine terminierten Aufträge
            </div>
          )}
          {timeline.map((entry) => {
            const end = resize?.id === entry.item.id ? resize.endH : entry.end
            const top = (entry.start - H0) * PPH
            const height = Math.max(24, (end - entry.start) * PPH - 3)
            const width = 100 / entry.lanes
            const left = entry.lane * width
            const done = entry.item.status === 'erledigt'
            const bg =
              entry.item.trade === 'innenausbau'
                ? colorVar('trade-innenausbau')
                : colorVar(`trade-${entry.item.trade}`)
            const fg = colorVar(`trade-${entry.item.trade}-fg`)
            return (
              <div
                key={entry.item.id}
                onClick={() => toggleOpen(entry.item.id)}
                className="absolute box-border cursor-pointer overflow-hidden rounded-lg px-1.5 py-1 shadow-sm"
                style={{
                  top,
                  left: `${left}%`,
                  width: `calc(${width}% - 4px)`,
                  height,
                  background: bg,
                  color: fg,
                  opacity: done ? 0.6 : 1,
                }}
              >
                <div className="truncate text-[10.5px] font-extrabold">
                  {surname(entry.item.client) || entry.item.title}
                </div>
                <div className="text-[9.5px] opacity-90">
                  {hm(entry.start)}–{hm(end)}
                </div>
                {canPlan && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      try {
                        e.currentTarget.setPointerCapture(e.pointerId)
                      } catch {
                        // ignore
                      }
                      dragRef.current = {
                        id: entry.item.id,
                        from: entry.item.from,
                        start: entry.start,
                        startY: e.clientY,
                        startEnd: entry.end,
                        curEnd: entry.end,
                      }
                      setResize({ id: entry.item.id, endH: entry.end })
                    }}
                    onPointerMove={(e) => {
                      const drag = dragRef.current
                      if (!drag || drag.id !== entry.item.id) return
                      let next = drag.startEnd + (e.clientY - drag.startY) / PPH
                      next = Math.round(next * 4) / 4
                      next = Math.max(drag.start + 0.25, Math.min(H1, next))
                      drag.curEnd = next
                      setResize({ id: drag.id, endH: next })
                    }}
                    onPointerUp={() => {
                      const drag = dragRef.current
                      if (!drag || drag.id !== entry.item.id) return
                      const newEnd = drag.curEnd
                      dragRef.current = null
                      setResize(null)
                      if (Math.abs(newEnd - drag.startEnd) >= 0.01) {
                        setOrderTime.mutate({ id: drag.id, from: drag.from, to: hm(newEnd) })
                      }
                    }}
                    onPointerCancel={() => {
                      dragRef.current = null
                      setResize(null)
                    }}
                    className="absolute inset-x-0 bottom-0 flex h-3.5 cursor-ns-resize touch-none items-center justify-center"
                  >
                    <div className="h-0.5 w-6 rounded-full opacity-70" style={{ background: fg }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {noTime.length > 0 && (
        <div className="mb-3.5">
          <div className="mb-2 text-sm font-extrabold text-sage-deep">Ohne feste Zeit</div>
          {renderCards(noTime)}
        </div>
      )}

      {BLOCKS.map(([a, b]) => {
        const blockOrders = dayOrders.filter((o) => {
          const bi = blockOf(o.from)
          return bi >= 0 && BLOCKS[bi][0] === a
        })
        return (
          <div key={a} className="mb-3.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm font-extrabold text-sage-deep">
                {a}:00 – {b}:00
              </div>
              <div className="h-px flex-1 bg-border" />
              {canPlan && (
                <button
                  type="button"
                  onClick={() => navigate(newOrderHref(`${a}:00`, `${b}:00`))}
                  className="flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted"
                >
                  <Plus size={12} /> Auftrag
                </button>
              )}
            </div>
            {renderCards(blockOrders)}
          </div>
        )
      })}

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
