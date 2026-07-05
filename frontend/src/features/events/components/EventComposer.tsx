import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { useCreateEvent } from '../hooks/useEventMutations'
import { EVENT_TYPES, EVENT_TYPE_VALUES, type EventType } from '../types/event'

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

export function EventComposer() {
  const { user } = useAuth()
  const create = useCreateEvent()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('fest')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [desc, setDesc] = useState('')

  const reset = () => {
    setTitle('')
    setType('fest')
    setDate('')
    setTime('')
    setLocation('')
    setDesc('')
    setOpen(false)
  }

  const submit = () => {
    if (!title.trim()) return
    create.mutate(
      {
        input: {
          title: title.trim(),
          type,
          date,
          time,
          location: location.trim(),
          desc: desc.trim(),
        },
        byId: user?.id ?? '',
      },
      { onSuccess: reset },
    )
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
        Neues Event / Schulung
      </Button>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="event-title">
          Titel *
        </label>
        <input
          id="event-title"
          className={fieldClass}
          placeholder="z. B. Sommerfest 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <div className="mb-1 text-xs font-medium text-muted">Art</div>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPE_VALUES.map((k) => {
            const Icon = EVENT_TYPES[k].icon
            return (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-semibold ${
                  type === k ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
                }`}
              >
                <Icon size={13} />
                {EVENT_TYPES[k].label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="event-date">
            Datum
          </label>
          <input
            id="event-date"
            type="date"
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="event-time">
            Uhrzeit
          </label>
          <input
            id="event-time"
            type="time"
            className={fieldClass}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="event-location">
          Ort
        </label>
        <input
          id="event-location"
          className={fieldClass}
          placeholder="z. B. Biergarten am Rhein"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="event-desc">
          Beschreibung
        </label>
        <textarea
          id="event-desc"
          className={`${fieldClass} min-h-[60px] resize-y`}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={reset}>
          Abbrechen
        </Button>
        <Button className="flex-1" disabled={create.isPending} onClick={submit}>
          Anlegen
        </Button>
      </div>
    </div>
  )
}
