import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Car } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useRoster } from '@/core/hooks/useRoster'
import { Button } from '@/core/components/Button'
import { addDays, fmtLong, iso, todayISO } from '@/core/lib/date'
import { useOrders } from '@/features/scheduling/hooks/useOrders'
import { useDeleteOrder } from '@/features/scheduling/hooks/useOrderMutations'
import { OrderCard } from '@/features/scheduling/components/OrderCard'
import { NotifySheet } from '@/features/scheduling/components/NotifySheet'
import { CompleteOrderDialog } from '@/features/scheduling/components/CompleteOrderDialog'
import type { Order } from '@/features/scheduling/types/order'
import { useEvents } from '@/features/events/hooks/useEvents'
import { useDeleteEvent } from '@/features/events/hooks/useEventMutations'
import { EventCard } from '@/features/events/components/EventCard'
import { usePosts } from '@/features/pinboard/hooks/usePosts'
import { useDeletePost } from '@/features/pinboard/hooks/usePostMutations'
import { PostCard } from '@/features/pinboard/components/PostCard'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
import { useAssignVehicle } from '@/features/vehicles/hooks/useVehicleMutations'

function Section({
  title,
  action,
  children,
}: {
  title: string
  action: { label: string; to: string }
  children: ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-sage-deep">{title}</h2>
        <Link
          to={action.to}
          className="flex items-center gap-1 text-xs font-semibold text-muted no-underline"
        >
          {action.label} <ArrowRight size={12} />
        </Link>
      </div>
      {children}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { user, canPlan } = useAuth()
  const { data: roster = [] } = useRoster()
  const today = todayISO()
  const tomorrow = iso(addDays(new Date(), 1))
  const userId = user?.id ?? ''

  const { data: rangeOrders = [], isLoading: ordersLoading } = useOrders(today, tomorrow)
  const myOrders = rangeOrders.filter((o) => o.assigned.includes(userId))
  const myOrdersToday = myOrders.filter((o) => o.date === today)
  const myOrdersTomorrow = myOrders.filter((o) => o.date === tomorrow)
  const deleteOrder = useDeleteOrder()
  const [openOrderIds, setOpenOrderIds] = useState<string[]>([])
  const [notifyOrder, setNotifyOrder] = useState<Order | null>(null)
  const [completeOrder, setCompleteOrder] = useState<Order | null>(null)
  const toggleOrderOpen = (id: string) =>
    setOpenOrderIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const renderOrders = (list: Order[], emptyText: string) =>
    list.length === 0 ? (
      <p className="mb-3 text-sm text-muted">{emptyText}</p>
    ) : (
      list.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          roster={roster}
          currentUserId={userId}
          canPlan={canPlan}
          isOpen={openOrderIds.includes(o.id)}
          onToggle={() => toggleOrderOpen(o.id)}
          onEdit={() => navigate(`/orders/${o.id}/edit`)}
          onDelete={() => deleteOrder.mutate(o.id)}
          onNotify={() => setNotifyOrder(o)}
          onComplete={() => setCompleteOrder(o)}
          onRapport={() => navigate(`/orders/${o.id}/rapports`)}
        />
      ))
    )

  const { data: events = [] } = useEvents()
  const todaysEvents = events.filter((e) => e.date === today)
  const deleteEvent = useDeleteEvent()

  // "Relevant" für die Pinnwand: angepinnt oder noch ungeklärt, angepinnte zuerst, max. 5 –
  // es gibt (noch) keine Gelesen-Markierung wie bei Aufträgen, daher diese Heuristik.
  const { data: posts = [] } = usePosts()
  const relevantPosts = posts
    .filter((p) => p.pinned || !p.resolved)
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.created).getTime() - new Date(a.created).getTime(),
    )
    .slice(0, 5)
  const deletePost = useDeletePost()

  const { data: vehicles = [] } = useVehicles()
  const myVehicle = vehicles.find((v) => v.assignedTo === userId)
  const freeVehicles = vehicles.filter((v) => !v.assignedTo)
  const assignVehicle = useAssignVehicle()

  return (
    <div className="mx-auto max-w-lg pb-16">
      <h1 className="mb-1 text-lg font-bold text-ink">Hallo{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="mb-4 text-sm text-muted capitalize">{fmtLong(today)}</p>

      <Section title="Meine Aufträge" action={{ label: 'Einsatzplan', to: '/schedule' }}>
        {ordersLoading ? (
          <p className="text-sm text-muted">Aufträge werden geladen…</p>
        ) : (
          <>
            <div className="mb-1.5 text-xs font-extrabold text-sage-deep">Heute</div>
            {renderOrders(myOrdersToday, 'Keine Aufträge für heute.')}
            <div className="mt-3 mb-1.5 text-xs font-extrabold text-sage-deep">Morgen</div>
            {renderOrders(myOrdersTomorrow, 'Keine Aufträge für morgen.')}
          </>
        )}
      </Section>

      <Section title="Fahrzeuge" action={{ label: 'Alle Fahrzeuge', to: '/vehicles' }}>
        {myVehicle ? (
          <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-page text-sage-deep">
                <Car size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-ink">{myVehicle.name}</div>
                <div className="text-xs text-muted">{myVehicle.plate || 'Kein Kennzeichen'}</div>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => assignVehicle.mutate({ id: myVehicle.id, userId: null })}
            >
              Freigeben
            </Button>
          </div>
        ) : freeVehicles.length > 0 ? (
          <>
            <p className="mb-2 text-sm text-muted">Dir ist kein Fahrzeug zugeordnet. Frei:</p>
            {freeVehicles.map((v) => (
              <div
                key={v.id}
                className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3.5"
              >
                <div>
                  <div className="text-sm font-bold text-ink">{v.name}</div>
                  <div className="text-xs text-muted">{v.plate || 'Kein Kennzeichen'}</div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => assignVehicle.mutate({ id: v.id, userId })}
                >
                  Mir zuordnen
                </Button>
              </div>
            ))}
          </>
        ) : (
          <p className="text-sm text-muted">Kein Fahrzeug zugeordnet, aktuell auch keine frei.</p>
        )}
      </Section>

      <Section title="Events heute" action={{ label: 'Alle Events', to: '/events' }}>
        {todaysEvents.length === 0 ? (
          <p className="text-sm text-muted">Keine Events heute.</p>
        ) : (
          todaysEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              roster={roster}
              currentUserId={userId}
              canPlan={canPlan}
              onDelete={() => deleteEvent.mutate(e.id)}
            />
          ))
        )}
      </Section>

      <Section title="Pinnwand" action={{ label: 'Zur Pinnwand', to: '/pinboard' }}>
        {relevantPosts.length === 0 ? (
          <p className="text-sm text-muted">Nichts Neues auf der Pinnwand.</p>
        ) : (
          relevantPosts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              roster={roster}
              currentUserId={userId}
              canPlan={canPlan}
              onDelete={() => deletePost.mutate(p.id)}
            />
          ))
        )}
      </Section>

      {notifyOrder && (
        <NotifySheet order={notifyOrder} members={roster} onClose={() => setNotifyOrder(null)} />
      )}
      {completeOrder && (
        <CompleteOrderDialog
          order={completeOrder}
          currentUserId={userId}
          onClose={() => setCompleteOrder(null)}
        />
      )}
    </div>
  )
}
