import { useState } from 'react'
import {
  Bookmark,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Euro,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { Button } from '@/core/components/Button'
import { DetailRow } from '@/core/components/DetailRow'
import { useSetProjectStatus } from '../hooks/useProjectMutations'
import type { Project } from '../types/project'
import { ProjectStatusPill } from './ProjectStatusPill'

interface ProjectCardProps {
  project: Project
  canPlan: boolean
  onSchedule: () => void
  onEdit: () => void
}

export function ProjectCard({ project: p, canPlan, onSchedule, onEdit }: ProjectCardProps) {
  const [open, setOpen] = useState(false)
  const setStatus = useSetProjectStatus()
  const address = [p.street, [p.zip, p.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  return (
    <div
      className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card"
      style={{ opacity: p.status === 'erledigt' && !open ? 0.72 : 1 }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-ink">
            {p.title || p.client || 'Projekt'}
          </div>
          <div className="truncate text-xs text-muted">
            {[p.client && p.title ? p.client : null, address].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        {p.projnr && (
          <span className="flex-none rounded-full bg-page px-2 py-0.5 text-[11px] font-bold text-muted">
            #{p.projnr}
          </span>
        )}
        <ProjectStatusPill status={p.status} />
      </button>

      {open && (
        <div className="px-3.5 pb-3.5">
          <div className="rounded-lg border border-border bg-page px-3">
            <DetailRow icon={User} label="Kunde" value={p.client} />
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
              value={p.phone}
              href={p.phone ? `tel:${p.phone.replace(/\s/g, '')}` : undefined}
            />
            <DetailRow icon={ClipboardList} label="Beschreibung" value={p.desc} />
            <DetailRow
              icon={Euro}
              label="Betrag"
              value={p.value != null ? `${p.value} €` : undefined}
            />
            <DetailRow icon={Calendar} label="Datum" value={p.date} />
            <DetailRow icon={Bookmark} label="TAIFUN-Nr" value={p.projnr} />
          </div>

          {p.scheduledOrder && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-pstatus-eingeplant-bg px-2.5 py-1 text-xs font-bold text-pstatus-eingeplant-fg">
              <CheckCircle2 size={14} /> Im Kalender eingeplant
            </div>
          )}

          {canPlan && (
            <>
              {p.status !== 'erledigt' && (
                <div className="mt-3">
                  <Button className="w-full" onClick={onSchedule}>
                    <CalendarPlus size={16} className="mr-1.5 inline-block align-text-bottom" />
                    In Kalender einplanen
                  </Button>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="secondary" className="flex-1" onClick={onEdit}>
                  Bearbeiten
                </Button>
                {p.status === 'erledigt' ? (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStatus.mutate({ id: p.id, status: 'offen' })}
                  >
                    Wieder öffnen
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStatus.mutate({ id: p.id, status: 'erledigt' })}
                  >
                    Erledigt
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
