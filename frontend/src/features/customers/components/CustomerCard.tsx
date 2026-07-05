import { useState } from 'react'
import { Building2, Mail, MapPin, Phone, Plus, StickyNote, User } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { DetailRow } from '@/core/components/DetailRow'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import type { Customer } from '../types/customer'

interface CustomerCardProps {
  customer: Customer
  canPlan: boolean
  onEdit: () => void
  onDelete: () => void
  onOrder: () => void
}

export function CustomerCard({
  customer: c,
  canPlan,
  onEdit,
  onDelete,
  onOrder,
}: CustomerCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const address = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <div className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-page text-sm font-extrabold text-sage-deep">
          {(c.name || c.contact || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">{c.name || c.contact || '—'}</div>
          <div className="truncate text-xs text-muted">
            {[c.city, c.phone].filter(Boolean).join(' · ') || address || '—'}
          </div>
        </div>
        {c.kdnr && (
          <span className="flex-none rounded-full bg-page px-2 py-0.5 text-[11px] font-bold text-muted">
            #{c.kdnr}
          </span>
        )}
      </button>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="rounded-lg border border-border bg-page px-3">
            <DetailRow icon={Building2} label="Firma / Name" value={c.name} />
            <DetailRow icon={User} label="Ansprechpartner" value={c.contact} />
            <DetailRow
              icon={MapPin}
              label="Adresse"
              value={address}
              href={
                address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : undefined
              }
            />
            <DetailRow
              icon={Phone}
              label="Telefon"
              value={c.phone}
              href={c.phone ? `tel:${c.phone.replace(/\s/g, '')}` : undefined}
            />
            <DetailRow
              icon={Mail}
              label="E-Mail"
              value={c.email}
              href={c.email ? `mailto:${c.email}` : undefined}
            />
            <DetailRow icon={StickyNote} label="Notizen" value={c.notes} />
          </div>
          {canPlan && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Button className="flex-1" onClick={onOrder}>
                <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
                Auftrag
              </Button>
              <Button variant="secondary" className="flex-1" onClick={onEdit}>
                Bearbeiten
              </Button>
              <Button variant="danger" className="flex-1" onClick={() => setConfirmDelete(true)}>
                Löschen
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Kunde löschen?"
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
