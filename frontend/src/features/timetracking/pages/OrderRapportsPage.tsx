import { Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { useRapportsForOrder } from '../hooks/useRapports'
import { useDeleteRapport } from '../hooks/useDeleteRapport'
import { RapportItem } from '../components/RapportItem'

export function OrderRapportsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const { user, canPlan } = useAuth()
  const { data: rapports = [], isLoading } = useRapportsForOrder(orderId ?? '')
  const deleteRapport = useDeleteRapport(orderId ?? '')

  return (
    <div className="mx-auto max-w-lg pb-16">
      <h1 className="mb-3 text-lg font-bold text-ink">Arbeitsrapporte</h1>

      <div className="mb-3">
        <Button className="w-full" onClick={() => navigate(`/orders/${orderId}/rapport/new`)}>
          <Plus size={16} className="mr-1.5 inline-block align-text-bottom" />
          Rapport erstellen
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Rapporte werden geladen…</p>
      ) : rapports.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">Noch kein Rapport erstellt.</div>
      ) : (
        rapports.map((r) => (
          <RapportItem
            key={r.id}
            rapport={r}
            canEdit={canPlan || r.author === user?.id}
            onEdit={() => navigate(`/orders/${orderId}/rapport/${r.id}/edit`)}
            onDelete={() => deleteRapport.mutate(r.id)}
          />
        ))
      )}
    </div>
  )
}
