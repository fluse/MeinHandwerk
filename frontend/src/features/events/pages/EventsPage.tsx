import { useAuth } from '@/core/auth/AuthProvider'
import { useRoster } from '@/core/hooks/useRoster'
import { todayISO } from '@/core/lib/date'
import { useEvents } from '../hooks/useEvents'
import { useDeleteEvent } from '../hooks/useEventMutations'
import { EventComposer } from '../components/EventComposer'
import { EventCard } from '../components/EventCard'

export function EventsPage() {
  const { user, canPlan } = useAuth()
  const { data: events = [], isLoading } = useEvents()
  const { data: roster = [] } = useRoster()
  const deleteEvent = useDeleteEvent()

  const today = todayISO()
  const upcoming = events
    .filter((e) => !e.date || e.date >= today)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
  const past = events
    .filter((e) => e.date && e.date < today)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-3 text-lg font-bold text-ink">Events & Termine</h1>

      {canPlan && (
        <div className="mb-3">
          <EventComposer />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Events werden geladen…</p>
      ) : (
        <>
          <div className="mb-2 text-xs font-extrabold text-sage-deep">Kommend</div>
          {upcoming.length === 0 ? (
            <div className="mb-2 text-sm text-muted">Keine kommenden Events.</div>
          ) : (
            upcoming.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                roster={roster}
                currentUserId={user?.id ?? ''}
                canPlan={canPlan}
                onDelete={() => deleteEvent.mutate(e.id)}
              />
            ))
          )}

          {past.length > 0 && (
            <>
              <div className="mb-2 mt-4 text-xs font-extrabold text-muted">Vergangen</div>
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  roster={roster}
                  currentUserId={user?.id ?? ''}
                  canPlan={canPlan}
                  onDelete={() => deleteEvent.mutate(e.id)}
                  past
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
