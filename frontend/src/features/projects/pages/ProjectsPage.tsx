import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { todayISO } from '@/core/lib/date'
import { useProjects } from '../hooks/useProjects'
import { ProjectCard } from '../components/ProjectCard'
import { PROJECT_STATUS_VALUES, PROJECT_STATUS_LABELS, type ProjectStatus } from '../types/project'
import type { Project } from '../types/project'

const FILTERS: Array<['alle' | ProjectStatus, string]> = [
  ['alle', 'Alle'],
  ...PROJECT_STATUS_VALUES.map(
    (s) => [s, PROJECT_STATUS_LABELS[s]] as ['alle' | ProjectStatus, string],
  ),
]

const ORDER: Record<ProjectStatus, number> = { offen: 0, eingeplant: 1, erledigt: 2 }

export function ProjectsPage() {
  const { canPlan } = useAuth()
  const navigate = useNavigate()
  const { data: projects = [], isLoading } = useProjects()
  const [filter, setFilter] = useState<'alle' | ProjectStatus>('alle')

  const list = [...projects]
    .filter((p) => filter === 'alle' || p.status === filter)
    .sort(
      (a, b) =>
        ORDER[a.status] - ORDER[b.status] ||
        (a.projnr || a.title).localeCompare(b.projnr || b.title),
    )

  const scheduleProject = (p: Project) => {
    const params = new URLSearchParams({
      title: p.title || `Auftrag ${p.projnr || ''}`,
      date: p.date || todayISO(),
      client: p.client,
      phone: p.phone,
      street: p.street,
      zip: p.zip,
      city: p.city,
      desc: p.desc,
      note: p.projnr ? `TAIFUN-Nr: ${p.projnr}` : '',
      project: p.id,
      customer: p.customer ?? '',
      site: p.site ?? '',
    })
    navigate(`/orders/new?${params.toString()}`)
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-ink">Projekte</h1>
        {canPlan && (
          <Button onClick={() => navigate('/projects/new')}>
            <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
            Neues Projekt
          </Button>
        )}
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
              filter === key ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Projekte werden geladen…</p>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">
          Keine Projekte. {canPlan ? 'Lege eins an.' : 'Bitte Chef/Büro fragen.'}
        </div>
      ) : (
        list.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            canPlan={canPlan}
            onSchedule={() => scheduleProject(p)}
            onEdit={() => navigate(`/projects/${p.id}/edit`)}
          />
        ))
      )}
    </div>
  )
}
