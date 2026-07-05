import { useNavigate, useParams } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import { ProjectForm } from '../components/ProjectForm'

export function ProjectFormPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(projectId)

  if (projectId && isLoading) {
    return <p className="text-sm text-muted">Projekt wird geladen…</p>
  }

  const goBack = () => navigate(-1)

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-ink">
        {projectId ? 'Projekt bearbeiten' : 'Neues Projekt'}
      </h1>
      <ProjectForm project={project} onDone={goBack} onCancel={goBack} />
    </div>
  )
}
