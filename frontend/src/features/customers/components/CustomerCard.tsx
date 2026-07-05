import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Mail, MapPin, Phone, Plus, StickyNote, Trash2, User } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { DetailRow } from '@/core/components/DetailRow'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useOrdersForCustomer, useProjectsForCustomer } from '@/core/hooks/useCustomerActivity'
import { useSites } from '../hooks/useSites'
import { useDeleteSite } from '../hooks/useSiteMutations'
import { SiteRow } from './SiteRow'
import { AddSiteForm } from './AddSiteForm'
import { EditSiteDialog } from './EditSiteDialog'
import type { Customer } from '../types/customer'
import type { Site } from '../types/site'

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
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [deletingSite, setDeletingSite] = useState<Site | null>(null)
  const address = [c.street, [c.zip, c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  const { data: sites = [] } = useSites(open ? c.id : '')
  const { data: orders = [] } = useOrdersForCustomer(open ? c.id : '')
  const { data: projects = [] } = useProjectsForCustomer(open ? c.id : '')
  const deleteSite = useDeleteSite(c.id)

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
                c.lat != null && c.lng != null
                  ? `https://maps.google.com/?q=${c.lat},${c.lng}`
                  : address
                    ? `https://maps.google.com/?q=${encodeURIComponent(address)}`
                    : undefined
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

          <div className="mt-2.5">
            <div className="mb-1.5 text-xs font-extrabold text-sage-deep">BAUSTELLEN</div>
            {sites.length === 0 && (
              <div className="mb-1.5 text-sm text-muted">Keine abweichenden Baustellen.</div>
            )}
            {sites.map((s) => (
              <SiteRow
                key={s.id}
                site={s}
                onEdit={() => setEditingSite(s)}
                onDelete={() => setDeletingSite(s)}
              />
            ))}
            {canPlan && <AddSiteForm customerId={c.id} />}
          </div>

          {(orders.length > 0 || projects.length > 0) && (
            <div className="mt-2.5">
              <div className="mb-1.5 text-xs font-extrabold text-sage-deep">
                AUFTRÄGE & PROJEKTE
              </div>
              <div className="rounded-lg border border-border bg-page px-3 py-1">
                {orders.map((o) => (
                  <ActivityRow
                    key={`order-${o.id}`}
                    item={o}
                    onClick={canPlan ? () => navigate(`/orders/${o.id}/edit`) : undefined}
                  />
                ))}
                {projects.map((p) => (
                  <ActivityRow
                    key={`project-${p.id}`}
                    item={p}
                    onClick={canPlan ? () => navigate(`/projects/${p.id}/edit`) : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {canPlan && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Button className="flex-1" onClick={onOrder}>
                <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
                Auftrag
              </Button>
              <Button variant="secondary" className="flex-1" onClick={onEdit}>
                Bearbeiten
              </Button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Kunde löschen"
                className="cursor-pointer rounded-md border border-border px-3 text-danger hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {editingSite && <EditSiteDialog site={editingSite} onClose={() => setEditingSite(null)} />}

      <ConfirmDialog
        open={deletingSite != null}
        title="Baustelle entfernen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Entfernen"
        onCancel={() => setDeletingSite(null)}
        onConfirm={() => {
          if (deletingSite) deleteSite.mutate(deletingSite.id)
          setDeletingSite(null)
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Kunde löschen?"
        description={
          orders.length + projects.length > 0
            ? `Dieser Kunde hat ${orders.length + projects.length} verknüpfte Aufträge/Projekte – die Verknüpfung geht dabei verloren. Dieser Vorgang kann nicht rückgängig gemacht werden.`
            : 'Dieser Vorgang kann nicht rückgängig gemacht werden.'
        }
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

function ActivityRow({
  item,
  onClick,
}: {
  item: { id: string; title: string; date: string }
  onClick?: () => void
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate">{item.title || '—'}</span>
      {item.date && <span className="flex-none text-muted">{item.date}</span>}
    </>
  )

  if (!onClick) {
    return (
      <div className="flex items-center gap-2 border-b border-border py-2 text-sm last:border-b-0">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-2 border-b border-border py-2 text-left text-sm font-semibold text-sage-deep last:border-b-0 hover:underline"
    >
      {content}
    </button>
  )
}
