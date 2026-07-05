import { useState } from 'react'
import { CheckCircle2, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { colorVar } from '@/core/lib/cssVar'
import { fmtLong } from '@/core/lib/date'
import type { RosterMember } from '@/core/api/roster'
import { useToggleRsvp } from '../hooks/useEventMutations'
import { EVENT_TYPES, type EventItem } from '../types/event'

interface EventCardProps {
  event: EventItem
  roster: RosterMember[]
  currentUserId: string
  canPlan: boolean
  onDelete: () => void
  past?: boolean
}

export function EventCard({
  event: e,
  roster,
  currentUserId,
  canPlan,
  onDelete,
  past,
}: EventCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toggleRsvp = useToggleRsvp()
  const t = EVENT_TYPES[e.type]
  const going = e.rsvp.includes(currentUserId)
  const nameById = Object.fromEntries(roster.map((m) => [m.id, m.name]))
  const attendeeNames = e.rsvp.map((id) => nameById[id] ?? id)

  return (
    <div
      className="mb-2.5 rounded-2xl border border-border bg-card p-3.5"
      style={{ borderLeft: `5px solid ${colorVar(`etype-${e.type}`)}`, opacity: past ? 0.7 : 1 }}
    >
      <div className="flex items-start gap-2.5">
        <t.icon size={26} className="text-sage-deep" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold">{e.title}</div>
          <div className="mt-0.5 text-xs text-muted">
            {e.date ? fmtLong(e.date) : 'Termin offen'}
            {e.time ? ` · ${e.time} Uhr` : ''}
            {e.location ? ` · ${e.location}` : ''}
          </div>
        </div>
        {canPlan && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="Event löschen"
            aria-label="Event löschen"
            className="text-danger"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {e.desc && <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.desc}</div>}

      <div className="mt-3 flex items-center gap-2.5">
        {!past && (
          <button
            type="button"
            onClick={() => toggleRsvp.mutate({ event: e, userId: currentUserId })}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold ${
              going ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
            }`}
          >
            {going && <CheckCircle2 size={16} />} Bin dabei
          </button>
        )}
        <div className="text-xs text-muted">
          {e.rsvp.length} Zusage{e.rsvp.length === 1 ? '' : 'n'}
        </div>
      </div>
      {attendeeNames.length > 0 && (
        <div className="mt-1.5 text-xs text-muted">Dabei: {attendeeNames.join(', ')}</div>
      )}
      <div className="mt-1.5 text-[11px] text-muted">angelegt von {nameById[e.by] ?? e.by}</div>

      <ConfirmDialog
        open={confirmDelete}
        title="Event löschen?"
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />
    </div>
  )
}
