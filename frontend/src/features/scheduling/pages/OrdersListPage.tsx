import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { useRoster } from '@/core/hooks/useRoster'
import { fmtLong } from '@/core/lib/date'
import { useOrdersList } from '../hooks/useOrdersList'
import { useDeleteOrder } from '../hooks/useOrderMutations'
import { OrderCard } from '../components/OrderCard'
import { NotifySheet } from '../components/NotifySheet'
import { CompleteOrderDialog } from '../components/CompleteOrderDialog'
import { TRADES, type Order } from '../types/order'

type StatusFilter = 'offen' | 'erledigt' | 'alle'

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'offen', label: 'Offen' },
  { value: 'erledigt', label: 'Erledigt' },
  { value: 'alle', label: 'Alle' },
]

export function OrdersListPage() {
  const navigate = useNavigate()
  const { user, canPlan, restricted } = useAuth()
  const { data: roster = [] } = useRoster()
  const { data: orders = [], isLoading } = useOrdersList()
  const deleteOrder = useDeleteOrder()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('offen')
  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState<string[]>([])
  const [notifyOrder, setNotifyOrder] = useState<Order | null>(null)
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null)

  const toggleOpen = (id: string) =>
    setOpenIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const chefIds = new Set(roster.filter((m) => m.role === 'chef').map((m) => m.id))
  const q = search.trim().toLowerCase()

  const list = orders
    .filter((o) => !restricted || !o.assigned.some((id) => chefIds.has(id)))
    .filter((o) => statusFilter === 'alle' || o.status === statusFilter)
    .filter(
      (o) =>
        !q ||
        [o.title, o.client, o.address, TRADES[o.trade]].some((v) => v.toLowerCase().includes(q)),
    )

  const grouped = new Map<string, Order[]>()
  for (const o of list) {
    const bucket = grouped.get(o.date)
    if (bucket) bucket.push(o)
    else grouped.set(o.date, [o])
  }
  const dates = Array.from(grouped.keys()).sort()

  return (
    <div className="mx-auto max-w-lg pb-16">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-ink">Aufträge</h1>
        {canPlan && (
          <Button onClick={() => navigate('/orders/new')}>
            <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
            Neuer Auftrag
          </Button>
        )}
      </div>

      <div className="mb-2.5 flex gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === f.value
                ? 'border-sage bg-page text-sage-deep'
                : 'border-border text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Suchen: Titel, Kunde, Adresse, Gewerk"
        className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
      />

      <div className="mt-2 pl-2 text-xs text-muted">
        {list.length} Auftrag{list.length === 1 ? '' : 'e'}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">Aufträge werden geladen…</p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">Keine Aufträge gefunden.</div>
      ) : (
        dates.map((d) => (
          <div key={d} className="mt-3.5">
            <div className="mb-2 text-sm font-extrabold text-sage-deep capitalize">
              {fmtLong(d)}
            </div>
            {grouped.get(d)!.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                roster={roster}
                currentUserId={user?.id ?? ''}
                canPlan={canPlan}
                isOpen={openIds.includes(o.id)}
                onToggle={() => toggleOpen(o.id)}
                onEdit={() => navigate(`/orders/${o.id}/edit`)}
                onDelete={() => deleteOrder.mutate(o.id)}
                onNotify={() => setNotifyOrder(o)}
                onComplete={() => setCompleteOrder(o)}
                onRapport={() => navigate(`/orders/${o.id}/rapports`)}
              />
            ))}
          </div>
        ))
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
