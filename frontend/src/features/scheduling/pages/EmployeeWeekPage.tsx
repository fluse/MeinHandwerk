import { useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { RoleIcon } from '@/core/components/RoleIcon'
import { addDays, iso, fmtShort } from '@/core/lib/date'
import { WD } from '@/core/lib/time'
import { useRoster } from '@/core/hooks/useRoster'
import { useOrders } from '../hooks/useOrders'
import { useWeekStart } from '../hooks/useWeekStart'
import { WeekNav } from '../components/WeekNav'
import { OrderCard } from '../components/OrderCard'
import { NotifySheet } from '../components/NotifySheet'
import { CompleteOrderDialog } from '../components/CompleteOrderDialog'
import type { Order } from '../types/order'
import { useDeleteOrder } from '../hooks/useOrderMutations'

export function EmployeeWeekPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user, canPlan, restricted } = useAuth()
  const { weekStart, setWeekStart } = useWeekStart()
  const { data: roster = [] } = useRoster()
  const weekDates = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  const { data: orders = [] } = useOrders(iso(weekStart), iso(weekDates[5]))
  const deleteOrder = useDeleteOrder()

  const [openIds, setOpenIds] = useState<string[]>([])
  const [notifyOrder, setNotifyOrder] = useState<Order | null>(null)
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null)

  const member = roster.find((m) => m.id === userId)
  const week = iso(weekStart)
  const hidden = restricted && member?.role === 'chef'

  const toggleOpen = (id: string) =>
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  if (!member) return <p className="text-sm text-muted">Mitarbeiter wird geladen…</p>

  if (hidden) {
    return (
      <div>
        <h1 className="mb-4 text-lg font-bold text-ink">{member.name}</h1>
        <div className="rounded-2xl bg-[#DFE2DC] p-10 text-center text-sage-text">
          <Lock size={32} className="mx-auto mb-2" />
          <div className="text-sm font-bold">Dieser Kalender ist nicht sichtbar</div>
          <div className="mt-1 text-xs text-muted">
            Die Planung der Chefs ist nur für die Leitung einsehbar.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg pb-16">
      <div className="mb-3 flex items-center gap-2">
        <RoleIcon role={member.role} size={26} />
        <h1 className="text-lg font-bold text-ink">{member.name}</h1>
      </div>
      <WeekNav weekStart={weekStart} onChange={setWeekStart} />

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted">Mitarbeiter:</span>
        <select
          value={member.id}
          onChange={(e) => navigate(`/week/${e.target.value}?week=${week}`)}
          className="flex-1 rounded-md border border-border px-2.5 py-2 text-sm"
        >
          {roster
            .filter((m) => !(restricted && m.role === 'chef'))
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      {weekDates.map((d, di) => {
        const dIso = iso(d)
        const dayOrders = orders.filter((o) => o.date === dIso && o.assigned.includes(member.id))
        return (
          <div key={dIso} className="mt-3.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="text-sm font-extrabold text-sage-deep">
                {WD[di]} · {fmtShort(d)}
              </div>
              <div className="h-px flex-1 bg-border" />
              {canPlan && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/orders/new?date=${dIso}&assigned=${member.id}&week=${week}`)
                  }
                  className="flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted"
                >
                  <Plus size={12} /> Auftrag
                </button>
              )}
            </div>
            {dayOrders.length === 0 ? (
              <div className="pb-0.5 text-xs text-muted">frei</div>
            ) : (
              dayOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  roster={roster}
                  currentUserId={user?.id ?? ''}
                  canPlan={canPlan}
                  isOpen={openIds.includes(o.id)}
                  onToggle={() => toggleOpen(o.id)}
                  onEdit={() => navigate(`/orders/${o.id}/edit?week=${week}`)}
                  onDelete={() => deleteOrder.mutate(o.id)}
                  onNotify={() => setNotifyOrder(o)}
                  onComplete={() => setCompleteOrder(o)}
                  onRapport={() => navigate(`/orders/${o.id}/rapports`)}
                />
              ))
            )}
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
