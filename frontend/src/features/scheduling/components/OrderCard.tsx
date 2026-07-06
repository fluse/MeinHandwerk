import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Bell,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  Plus,
  StickyNote,
  Trash2,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { surname, formatAddress } from '@/core/lib/format'
import { fmtShort, todayISO } from '@/core/lib/date'
import { colorVar } from '@/core/lib/cssVar'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { DetailRow } from '@/core/components/DetailRow'
import { MapsAppDialog } from '@/core/components/MapsAppDialog'
import { Overlay } from '@/core/components/Overlay'
import type { RosterMember } from '@/core/api/roster'
import { geocodeAddress } from '@/core/api/geocoding'
import { useOrderPhotos, useUploadOrderPhoto, useDeleteOrderPhoto } from '../hooks/useOrderPhotos'
import { useMarkOrderRead, useOrderReads } from '../hooks/useOrderReads'
import { useCreateOrderCheckin, useOrderCheckins } from '@/core/hooks/useOrderCheckins'
import { useReopenOrder } from '../hooks/useOrderMutations'
import { useVehicles } from '@/features/vehicles/hooks/useVehicles'
import { useUpdateVehicleLocation } from '@/features/vehicles/hooks/useVehicleMutations'
import type { ScheduledOrder } from '../types/order'
import { TradeBadge } from './TradeBadge'
import { StatusPill } from './StatusPill'

// Verzögerung, bevor der "Angekommen?"-Fallback-Dialog automatisch aufpoppt (siehe
// feature-meldungen.md) – sonst würde er den Mitarbeiter direkt nach dem Losfahren stören.
const ARRIVAL_PROMPT_DELAY_MS = 60 * 60 * 1000

/** Zeigt die Auftragsdetails inline (Standard) oder als Bottom-Sheet (Startseite) an. */
function OrderDetails({
  sheet,
  onClose,
  children,
}: {
  sheet: boolean
  onClose: () => void
  children: ReactNode
}) {
  if (sheet) {
    return (
      <Overlay variant="sheet" responsive onBackdropClick={onClose} onClose={onClose}>
        {children}
      </Overlay>
    )
  }
  return <div className="px-3.5 pb-4">{children}</div>
}

interface OrderCardProps {
  order: ScheduledOrder
  roster: RosterMember[]
  currentUserId: string
  canPlan: boolean
  isOpen: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onNotify: () => void
  onComplete: () => void
  onRapport: () => void
  /** Zeigt die Details statt inline aufgeklappt in einem Bottom-Sheet an. */
  sheet?: boolean
}

export function OrderCard({
  order,
  roster,
  currentUserId,
  canPlan,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onNotify,
  onComplete,
  onRapport,
  sheet = false,
}: OrderCardProps) {
  const nameById = Object.fromEntries(roster.map((m) => [m.id, m.name]))
  const assignedNames = order.assigned.map((id) => nameById[id] ?? id)

  const { data: photos = [] } = useOrderPhotos(order.id, isOpen)
  const uploadPhoto = useUploadOrderPhoto(order.id)
  const deletePhoto = useDeleteOrderPhoto(order.id)
  const { data: reads = {} } = useOrderReads(order.id, isOpen)
  const markRead = useMarkOrderRead(order.id)
  const { data: checkins = [] } = useOrderCheckins(order.id, isOpen)
  const createCheckin = useCreateOrderCheckin(order.id)
  const reopen = useReopenOrder()
  const { data: vehicles = [] } = useVehicles()
  const updateVehicleLocation = useUpdateVehicleLocation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showMaps, setShowMaps] = useState(false)
  const [dismissedArrivalPrompt, setDismissedArrivalPrompt] = useState(false)
  // Ob die 60-Minuten-Verzögerung für den Ankunfts-Fallback (siehe unten) abgelaufen ist. Wird
  // nur per Timer in einem Effect gesetzt, nie über Date.now() direkt im Render berechnet
  // (React-Compiler-Regel: keine unreinen Aufrufe während des Renderns).
  const [arrivalPromptDue, setArrivalPromptDue] = useState(false)

  const isAssignedToMe = order.assigned.includes(currentUserId)
  const address = formatAddress(order.street, order.zip, order.city)
  const mapsHref = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : undefined

  const myEnroute = checkins.find((c) => c.employee === currentUserId && c.type === 'unterwegs')
  const myArrived = checkins.find((c) => c.employee === currentUserId && c.type === 'angekommen')

  // "Arbeit begonnen"/"verlassen" gelten für den ganzen Auftrag, nicht pro Mitarbeiter (siehe
  // feature-order-flow-vehicle-position.md) – first-come-first-served, daher hier ohne
  // currentUserId-Filter. isToday gatet alle vier Checkin-Buttons: ohne Termin heute (aktuell
  // `orders.date`, solange es noch kein `order_blocks` gibt) ergibt kein Tap Sinn.
  const isToday = order.date === todayISO()
  const workCheckins = checkins.filter(
    (c) => c.type === 'arbeit_begonnen' || c.type === 'verlassen',
  )
  const lastWork = workCheckins[workCheckins.length - 1]
  const inArbeit = lastWork?.type === 'arbeit_begonnen'
  const lastLeft = [...checkins].reverse().find((c) => c.type === 'verlassen')
  const myLastArrived = [...checkins]
    .reverse()
    .find((c) => c.employee === currentUserId && c.type === 'angekommen')
  const canStartWork =
    isToday &&
    isAssignedToMe &&
    !inArbeit &&
    myLastArrived != null &&
    (!lastLeft || myLastArrived.created > lastLeft.created)
  const canLeave = isToday && isAssignedToMe && inArbeit
  const lastWorkEmployeeName = lastWork ? (nameById[lastWork.employee] ?? lastWork.employee) : ''
  const lastWorkTime = lastWork
    ? new Date(lastWork.created).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    : ''

  const myVehicle = vehicles.find((v) => v.assignedTo === currentUserId)

  // Setzt arrivalPromptDue zurück, sobald sich der relevante Checkin ändert (neuer Auftrag,
  // Checkins noch nicht geladen, ...). Zustandsanpassung während des Renderns statt in einem
  // Effect (React-Muster für "State beim Ändern einer externen Bedingung zurücksetzen").
  const enrouteKey = myEnroute?.id ?? ''
  const [prevEnrouteKey, setPrevEnrouteKey] = useState(enrouteKey)
  if (enrouteKey !== prevEnrouteKey) {
    setPrevEnrouteKey(enrouteKey)
    setArrivalPromptDue(false)
  }

  // Fallback für vergessene Ankunftsmeldung: poppt erst 60 Minuten nach "unterwegs" auf (sonst
  // stört er den Mitarbeiter, der gerade erst losgefahren ist), ist wegklickbar, taucht aber bei
  // jedem erneuten Öffnen der Auftragskarte wieder auf, solange keine Ankunft bestätigt wurde
  // (siehe feature-meldungen.md). Der "Bin jetzt angekommen"-Button selbst ist davon unberührt
  // und bleibt sofort nutzbar.
  const arrivalPending =
    isOpen && isAssignedToMe && Boolean(myEnroute) && !myArrived && arrivalPromptDue
  const [prevArrivalPending, setPrevArrivalPending] = useState(arrivalPending)
  if (arrivalPending !== prevArrivalPending) {
    setPrevArrivalPending(arrivalPending)
    if (arrivalPending) setDismissedArrivalPrompt(false)
  }
  const showArrivalPrompt = arrivalPending && !dismissedArrivalPrompt

  useEffect(() => {
    if (isOpen && isAssignedToMe && !reads[currentUserId]) {
      markRead.mutate(currentUserId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Startet den 60-Minuten-Timer für den Ankunfts-Fallback. setState passiert nur im
  // Timer-Callback, nicht synchron im Effect-Body – das ist das von React vorgesehene Muster
  // für "auf ein externes Zeit-Ereignis reagieren" und löst keine kaskadierenden Renders aus.
  useEffect(() => {
    if (!isOpen || !isAssignedToMe || !myEnroute || myArrived || arrivalPromptDue) return
    const remaining = ARRIVAL_PROMPT_DELAY_MS - (Date.now() - new Date(myEnroute.created).getTime())
    const timer = setTimeout(() => setArrivalPromptDue(true), Math.max(remaining, 0))
    return () => clearTimeout(timer)
  }, [isOpen, isAssignedToMe, myEnroute, myArrived, arrivalPromptDue])

  const handleEnroute = () => {
    createCheckin.mutate({ employeeId: currentUserId, type: 'unterwegs' })
    setShowMaps(true)
  }

  const handleArrived = () => {
    createCheckin.mutate({ employeeId: currentUserId, type: 'angekommen' })
    setDismissedArrivalPrompt(true)

    // Fahrzeugposition transparent als Nebeneffekt des Ankunfts-Taps mitführen (siehe
    // feature-order-flow-vehicle-position.md): nur falls dem Mitarbeiter ein Fahrzeug zugeordnet
    // ist. Kein Fehlerdialog bei Ablehnung/Fehler – der Checkin selbst ist wichtiger, per
    // Geocoding der Auftragsadresse wird trotzdem versucht, wenigstens die Adresse zu setzen.
    if (myVehicle) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateVehicleLocation.mutate({
            id: myVehicle.id,
            location: {
              address,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          })
        },
        () => {
          geocodeAddress(address).then((result) => {
            if (!result) return
            updateVehicleLocation.mutate({
              id: myVehicle.id,
              location: { address, lat: result.lat, lng: result.lng },
            })
          })
        },
      )
    }
  }

  const handleStartWork = () => {
    createCheckin.mutate({ employeeId: currentUserId, type: 'arbeit_begonnen' })
  }

  const handleLeave = () => {
    createCheckin.mutate({ employeeId: currentUserId, type: 'verlassen' })
  }

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return
    Array.from(files).forEach((file) => uploadPhoto.mutate({ file, uploadedBy: currentUserId }))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card"
      style={{
        opacity: order.status === 'erledigt' && !isOpen ? 0.7 : 1,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">
            {surname(order.client) || order.title}
          </div>
          <div className="truncate text-xs text-muted">
            {order.street || '—'}
            {order.from ? ` · ${fmtShort(new Date(order.date + 'T00:00:00'))} ${order.from}` : ''}
          </div>
        </div>
        <TradeBadge trade={order.trade} />
        {inArbeit && order.status === 'offen' && (
          <span
            className="flex-none whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{
              background: colorVar('pstatus-eingeplant-bg'),
              color: colorVar('pstatus-eingeplant-fg'),
            }}
          >
            In Arbeit
          </span>
        )}
        <StatusPill status={order.status} />
      </button>

      {isOpen && (
        <OrderDetails sheet={sheet} onClose={onToggle}>
          <div className="mb-2 text-base font-extrabold">{order.title}</div>
          <div className="rounded-lg border border-border bg-page px-3">
            <DetailRow
              icon={User}
              label="Auftraggeber"
              value={
                order.customerName ? `${order.client} · 🔗 ${order.customerName}` : order.client
              }
            />
            <DetailRow
              icon={Phone}
              label="Telefon"
              value={order.phone}
              href={order.phone ? `tel:${order.phone.replace(/\s/g, '')}` : undefined}
            />
            <DetailRow icon={MapPin} label="Adresse" value={address} href={mapsHref} />
            <DetailRow icon={Wrench} label="Material" value={order.material} />
            <DetailRow icon={ClipboardList} label="Leistung" value={order.desc} />
            <DetailRow icon={StickyNote} label="Notiz" value={order.note} />
            {assignedNames.length > 0 && (
              <div className="py-2 text-xs">
                <span className="font-semibold text-muted">Team: </span>
                {assignedNames.join(', ')}
              </div>
            )}
          </div>

          {order.status === 'erledigt' && (
            <div className="mt-3 rounded-lg bg-status-erledigt-bg px-3 py-2.5 text-xs text-status-erledigt-fg">
              <b>Abgeschlossen</b> von {nameById[order.closedBy] ?? order.closedBy}. Rapportzettel:{' '}
              {order.rapportSigned ? (
                <>
                  unterschrieben <Check size={12} className="inline-block align-text-bottom" />
                </>
              ) : (
                'NICHT unterschrieben'
              )}
              {!order.rapportSigned && order.rapportReason ? ` — ${order.rapportReason}` : ''}.
            </div>
          )}

          <div className="mt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-extrabold">Fotos ({photos.length})</div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted"
              >
                <Plus size={12} className="mr-1 inline-block align-text-bottom" />
                Foto
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => onFiles(e.target.files)}
                className="hidden"
              />
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5">
                {photos.map((p) => (
                  <div key={p.id} className="relative">
                    <img
                      src={p.url}
                      alt=""
                      className="aspect-square w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deletePhoto.mutate(p.id)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/55 text-xs text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {order.status === 'offen' ? (
              <Button className="flex-1" onClick={onComplete}>
                <CheckCircle2 size={16} className="mr-1.5 inline-block align-text-bottom" />
                Als erledigt melden
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => reopen.mutate(order.id)}
              >
                Wieder öffnen
              </Button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {mapsHref && isToday && isAssignedToMe && !myEnroute && (
              <Button variant="secondary" className="flex-1" onClick={handleEnroute}>
                <Navigation size={16} className="mr-1.5 inline-block align-text-bottom" />
                Mache mich jetzt auf den Weg zum Kunden
              </Button>
            )}
            {isToday && isAssignedToMe && myEnroute && !myArrived && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDismissedArrivalPrompt(false)}
              >
                <MapPin size={16} className="mr-1.5 inline-block align-text-bottom" />
                Bin jetzt beim Kunden angekommen
              </Button>
            )}
            {canStartWork && (
              <Button variant="secondary" className="flex-1" onClick={handleStartWork}>
                <PlayCircle size={16} className="mr-1.5 inline-block align-text-bottom" />
                Arbeit jetzt beginnen
              </Button>
            )}
            {canLeave && (
              <Button variant="secondary" className="flex-1" onClick={handleLeave}>
                <LogOut size={16} className="mr-1.5 inline-block align-text-bottom" />
                Auftragsort jetzt verlassen
              </Button>
            )}
            {mapsHref && !isAssignedToMe && (
              <Button variant="secondary" className="flex-1" onClick={() => setShowMaps(true)}>
                <Navigation size={16} className="mr-1.5 inline-block align-text-bottom" />
                Navigation
              </Button>
            )}
            <Button variant="secondary" className="flex-1" onClick={onRapport}>
              <FileText size={16} className="mr-1.5 inline-block align-text-bottom" />
              Arbeitsrapport
            </Button>
          </div>
          {isToday && isAssignedToMe && lastWork && (
            <div className="mt-1.5 text-xs text-muted">
              {inArbeit
                ? `Arbeit begonnen um ${lastWorkTime} (von ${lastWorkEmployeeName})`
                : `Auftragsort verlassen um ${lastWorkTime} (von ${lastWorkEmployeeName})`}
            </div>
          )}

          {canPlan && order.assigned.length > 0 && (
            <div className="mt-3 rounded-lg border border-border bg-page px-3 py-2">
              <div className="mb-1 text-[11px] font-extrabold text-muted">LESEBESTÄTIGUNG</div>
              {order.assigned.map((id) => {
                const readAt = reads[id]
                return (
                  <div
                    key={id}
                    className={`flex justify-between gap-2 py-0.5 text-xs ${readAt ? 'text-sage-deep' : 'text-muted'}`}
                  >
                    <span className="flex items-center gap-1 truncate">
                      {readAt ? <Check size={12} /> : <Circle size={6} fill="currentColor" />}
                      {nameById[id] ?? id}
                    </span>
                    <span className={`whitespace-nowrap ${readAt ? 'font-bold' : ''}`}>
                      {readAt
                        ? new Date(readAt).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'noch nicht gelesen'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          {!canPlan && isAssignedToMe && reads[currentUserId] && (
            <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-sage-deep">
              <Check size={12} /> Gelesen am{' '}
              {new Date(reads[currentUserId]).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}

          {canPlan && (
            <>
              {order.assigned.length > 0 && (
                <div className="mt-2">
                  <Button variant="secondary" className="w-full" onClick={onNotify}>
                    <Bell size={16} className="mr-1.5 inline-block align-text-bottom" />
                    Mitarbeiter benachrichtigen
                  </Button>
                </div>
              )}
              <hr className="border-slate-300 my-4" />
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onEdit}>
                  Bearbeiten
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                  title="Auftrag löschen"
                  aria-label="Auftrag löschen"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </>
          )}
        </OrderDetails>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Auftrag löschen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />

      <MapsAppDialog open={showMaps} target={{ address }} onClose={() => setShowMaps(false)} />

      <ConfirmDialog
        open={showArrivalPrompt}
        title="Angekommen?"
        description="Bist du bereits beim Kunden angekommen?"
        confirmLabel="Ja, angekommen"
        onCancel={() => setDismissedArrivalPrompt(true)}
        onConfirm={handleArrived}
      />
    </div>
  )
}
