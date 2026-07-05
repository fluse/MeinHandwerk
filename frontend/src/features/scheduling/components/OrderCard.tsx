import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  MapPin,
  Phone,
  Plus,
  StickyNote,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { surname, shortAddr } from '@/core/lib/format'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { DetailRow } from '@/core/components/DetailRow'
import type { RosterMember } from '@/core/api/roster'
import { useOrderPhotos, useUploadOrderPhoto, useDeleteOrderPhoto } from '../hooks/useOrderPhotos'
import { useMarkOrderRead, useOrderReads } from '../hooks/useOrderReads'
import { useReopenOrder } from '../hooks/useOrderMutations'
import type { Order } from '../types/order'
import { TradeBadge } from './TradeBadge'
import { StatusPill } from './StatusPill'

interface OrderCardProps {
  order: Order
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
}: OrderCardProps) {
  const nameById = Object.fromEntries(roster.map((m) => [m.id, m.name]))
  const assignedNames = order.assigned.map((id) => nameById[id] ?? id)

  const { data: photos = [] } = useOrderPhotos(order.id, isOpen)
  const uploadPhoto = useUploadOrderPhoto(order.id)
  const deletePhoto = useDeleteOrderPhoto(order.id)
  const { data: reads = {} } = useOrderReads(order.id, isOpen)
  const markRead = useMarkOrderRead(order.id)
  const reopen = useReopenOrder()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isAssignedToMe = order.assigned.includes(currentUserId)

  useEffect(() => {
    if (isOpen && isAssignedToMe && !reads[currentUserId]) {
      markRead.mutate(currentUserId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return
    Array.from(files).forEach((file) => uploadPhoto.mutate({ file, uploadedBy: currentUserId }))
    if (fileRef.current) fileRef.current.value = ''
  }

  const borderColor =
    order.trade === 'innenausbau'
      ? 'var(--color-trade-innenausbau-border)'
      : `var(--color-trade-${order.trade})`

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card"
      style={{
        borderLeft: `5px solid ${borderColor}`,
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
            {shortAddr(order.address) || '—'}
            {order.from ? ` · ${order.from}` : ''}
          </div>
        </div>
        <TradeBadge trade={order.trade} />
        <StatusPill status={order.status} />
      </button>

      {isOpen && (
        <div className="px-3.5 pb-4">
          <div className="mb-2 text-base font-extrabold">{order.title}</div>
          <div className="rounded-lg border border-border bg-page px-3">
            <DetailRow icon={User} label="Auftraggeber" value={order.client} />
            <DetailRow
              icon={Phone}
              label="Telefon"
              value={order.phone}
              href={order.phone ? `tel:${order.phone.replace(/\s/g, '')}` : undefined}
            />
            <DetailRow
              icon={MapPin}
              label="Adresse"
              value={order.address}
              href={
                order.address
                  ? `https://maps.google.com/?q=${encodeURIComponent(order.address)}`
                  : undefined
              }
            />
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
          <div className="mt-2">
            <Button variant="secondary" className="w-full" onClick={onRapport}>
              <FileText size={16} className="mr-1.5 inline-block align-text-bottom" />
              Arbeitsrapport
            </Button>
          </div>

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
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={onEdit}>
                  Bearbeiten
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => setConfirmDelete(true)}>
                  Löschen
                </Button>
              </div>
            </>
          )}
        </div>
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
    </div>
  )
}
