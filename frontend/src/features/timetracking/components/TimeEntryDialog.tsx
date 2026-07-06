import { useState } from 'react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { Overlay } from '@/core/components/Overlay'
import { ROLES } from '@/core/lib/roles'
import { hoursBetween } from '@/core/lib/time'
import { todayISO } from '@/core/lib/date'
import type { RosterMember } from '@/core/api/roster'
import {
  useCreateTimeEntry,
  useDeleteTimeEntry,
  useUpdateTimeEntry,
} from '../hooks/useTimelogMutations'
import { useOrderLookup } from '../hooks/useOrderLookup'
import type { TimeEntry } from '../types/timelog'

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

interface TimeEntryDialogProps {
  entry?: TimeEntry
  defaultEmployeeId: string
  canPlan: boolean
  roster: RosterMember[]
  onClose: () => void
}

export function TimeEntryDialog({
  entry,
  defaultEmployeeId,
  canPlan,
  roster,
  onClose,
}: TimeEntryDialogProps) {
  const create = useCreateTimeEntry()
  const update = useUpdateTimeEntry()
  const del = useDeleteTimeEntry()
  const { data: orders = [] } = useOrderLookup()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [employee, setEmployee] = useState(entry?.employee ?? defaultEmployeeId)
  const [date, setDate] = useState(entry?.date ?? todayISO())
  const [von, setVon] = useState(entry?.von ?? '')
  const [bis, setBis] = useState(entry?.bis ?? '')
  const [hours, setHours] = useState(entry?.hours ? String(entry.hours) : '')
  const [travelVon, setTravelVon] = useState(entry?.travelVon ?? '')
  const [travelBis, setTravelBis] = useState(entry?.travelBis ?? '')
  const [travel, setTravel] = useState(entry?.travel ? String(entry.travel) : '')
  const [order, setOrder] = useState(entry?.order ?? '')
  const [note, setNote] = useState(entry?.note ?? '')
  const [error, setError] = useState('')

  const employeeName = roster.find((m) => m.id === employee)?.name ?? ''

  const onVonChange = (v: string) => {
    setVon(v)
    if (v && bis) setHours(String(hoursBetween(v, bis)))
  }
  const onBisChange = (v: string) => {
    setBis(v)
    if (von && v) setHours(String(hoursBetween(von, v)))
    if (v && !travelVon) setTravelVon(v)
  }
  const onTravelVonChange = (v: string) => {
    setTravelVon(v)
    if (v && travelBis) setTravel(String(hoursBetween(v, travelBis)))
  }
  const onTravelBisChange = (v: string) => {
    setTravelBis(v)
    if (travelVon && v) setTravel(String(hoursBetween(travelVon, v)))
  }

  const submit = () => {
    setError('')
    const input = { employee, date, von, bis, hours, travelVon, travelBis, travel, order, note }
    const onError = () => setError('Bitte Arbeitszeit oder Fahrzeit eingeben.')
    if (entry) {
      update.mutate({ id: entry.id, input }, { onSuccess: onClose, onError })
    } else {
      create.mutate(input, { onSuccess: onClose, onError })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <Overlay variant="sheet">
      <h2 className="mb-3.5 text-lg font-extrabold text-ink">Stunden erfassen</h2>

      {canPlan ? (
        <div className="mb-3 flex flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="employee">
            Mitarbeiter
          </label>
          <select
            id="employee"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
            className={fieldClass}
          >
            {roster.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {ROLES[m.role].label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-3 text-sm">
          Mitarbeiter: <b>{employeeName}</b>
        </div>
      )}

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="date">
          Datum
        </label>
        <input
          id="date"
          type="date"
          className={fieldClass}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="mb-1.5 text-xs font-extrabold text-sage-deep">ARBEITSZEIT BEIM KUNDEN</div>
      <div className="mb-1.5 flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="von">
            Ankunftszeit beim Kunden
          </label>
          <input
            id="von"
            type="time"
            className={fieldClass}
            value={von}
            onChange={(e) => onVonChange(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="bis">
            Abfahrtszeit beim Kunden
          </label>
          <input
            id="bis"
            type="time"
            className={fieldClass}
            value={bis}
            onChange={(e) => onBisChange(e.target.value)}
          />
        </div>
      </div>
      {von && bis && (
        <div className="mb-2 text-sm font-bold text-sage-deep">
          = {hoursBetween(von, bis).toString().replace('.', ',')} h Arbeitszeit
        </div>
      )}
      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="hours">
          Arbeitsstunden {von && bis ? '(aus Ankunft/Abfahrt)' : '(manuell)'}
        </label>
        <input
          id="hours"
          type="number"
          step="0.25"
          inputMode="decimal"
          className={fieldClass}
          placeholder="z. B. 7.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
        />
      </div>

      <div className="my-2.5 border-t border-border" />
      <div className="mb-1 text-xs font-extrabold text-sage-deep">FAHRZEIT (RÜCKFAHRT)</div>
      <div className="mb-1.5 text-xs text-muted">
        Wann bei Kunde/Baustelle losgefahren – wann in Firma/zu Hause angekommen.
      </div>
      <div className="mb-1.5 flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="travelVon">
            Abfahrt Baustelle
          </label>
          <input
            id="travelVon"
            type="time"
            className={fieldClass}
            value={travelVon}
            onChange={(e) => onTravelVonChange(e.target.value)}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="travelBis">
            Ankunft Firma/Zuhause
          </label>
          <input
            id="travelBis"
            type="time"
            className={fieldClass}
            value={travelBis}
            onChange={(e) => onTravelBisChange(e.target.value)}
          />
        </div>
      </div>
      {travelVon && travelBis && (
        <div className="mb-2 text-sm font-bold text-sage-deep">
          = {hoursBetween(travelVon, travelBis).toString().replace('.', ',')} h Fahrzeit
        </div>
      )}
      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="travel">
          Fahrzeit (Std) {travelVon && travelBis ? '(aus Abfahrt/Ankunft)' : '(manuell)'}
        </label>
        <input
          id="travel"
          type="number"
          step="0.25"
          inputMode="decimal"
          className={fieldClass}
          placeholder="z. B. 0.5"
          value={travel}
          onChange={(e) => setTravel(e.target.value)}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="order">
          Auftrag (optional)
        </label>
        <select
          id="order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className={fieldClass}
        >
          <option value="">— ohne Auftrag —</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
              {o.client ? ` · ${o.client}` : ''} ({o.date})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="note">
          Notiz (optional)
        </label>
        <input
          id="note"
          className={fieldClass}
          placeholder="z. B. Montage Innengeräte"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Abbrechen
        </Button>
        <Button className="flex-1" disabled={isPending} onClick={submit}>
          Speichern
        </Button>
      </div>

      {entry && (
        <Button variant="danger" className="mt-2.5 w-full" onClick={() => setConfirmDelete(true)}>
          Eintrag löschen
        </Button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Eintrag löschen?"
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (entry) del.mutate(entry.id, { onSuccess: onClose })
          setConfirmDelete(false)
        }}
      />
    </Overlay>
  )
}
