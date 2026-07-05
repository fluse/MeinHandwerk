import { useState } from 'react'
import { PenLine, Trash2 } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useRapportMaterials } from '../hooks/useRapportMaterials'
import type { Rapport } from '../types/rapport'

interface RapportItemProps {
  rapport: Rapport
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}

export function RapportItem({ rapport: r, canEdit, onEdit, onDelete }: RapportItemProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: materials = [] } = useRapportMaterials(r.id, open)

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold">
            {new Date(`${r.date}T00:00:00`).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </div>
          <div className="truncate text-xs text-muted">{r.text}</div>
        </div>
        {r.signatureUrl ? (
          <span className="flex items-center gap-1 whitespace-nowrap rounded-full bg-status-erledigt-bg px-2 py-0.5 text-[11px] font-bold text-status-erledigt-fg">
            <PenLine size={11} /> signiert
          </span>
        ) : (
          <span className="whitespace-nowrap rounded-full bg-status-offen-bg px-2 py-0.5 text-[11px] font-bold text-status-offen-fg">
            offen
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3">
          <div className="mb-2.5 whitespace-pre-wrap text-sm leading-relaxed">{r.text}</div>

          {materials.length > 0 && (
            <div className="mb-2.5 overflow-hidden rounded-lg border border-border">
              <div className="flex bg-page px-2.5 py-1.5 text-[11px] font-extrabold text-sage-deep">
                <div className="w-14">Menge</div>
                <div className="w-14">Einh.</div>
                <div className="flex-1">Bezeichnung</div>
              </div>
              {materials.map((m) => (
                <div key={m.id} className="flex border-t border-border px-2.5 py-1.5 text-sm">
                  <div className="w-14">{m.qty}</div>
                  <div className="w-14 text-muted">{m.unit}</div>
                  <div className="flex-1">{m.desc}</div>
                </div>
              ))}
            </div>
          )}

          {r.signatureUrl && (
            <div className="mb-2">
              <div className="mb-1 text-[11px] font-semibold text-muted">
                Unterschrift{r.signedName ? ` – ${r.signedName}` : ''}
              </div>
              <img
                src={r.signatureUrl}
                alt="Unterschrift"
                className="max-h-28 rounded-lg border border-border bg-card"
              />
            </div>
          )}

          {canEdit && (
            <div className="mt-1 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onEdit}>
                Bearbeiten
              </Button>
              <Button
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                title="Rapport löschen"
                aria-label="Rapport löschen"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Rapport löschen?"
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
