import { useNavigate, useParams } from 'react-router-dom'
import { useRapport } from '../hooks/useRapport'
import { useRapportMaterials } from '../hooks/useRapportMaterials'
import { RapportForm } from '../components/RapportForm'

export function RapportFormPage() {
  const { orderId, rapportId } = useParams<{ orderId: string; rapportId: string }>()
  const navigate = useNavigate()
  const { data: rapport, isLoading: loadingRapport } = useRapport(rapportId)
  const { data: materials = [], isLoading: loadingMaterials } = useRapportMaterials(
    rapportId ?? '',
    !!rapportId,
  )

  if (rapportId && (loadingRapport || loadingMaterials)) {
    return <p className="text-sm text-muted">Rapport wird geladen…</p>
  }

  const goBack = () => navigate(`/orders/${orderId}/rapports`)

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold text-ink">
        {rapportId ? 'Rapport bearbeiten' : 'Arbeitsrapport'}
      </h1>
      <RapportForm
        orderId={orderId ?? ''}
        rapport={rapport}
        initialMaterials={materials}
        onDone={goBack}
        onCancel={goBack}
      />
    </div>
  )
}
