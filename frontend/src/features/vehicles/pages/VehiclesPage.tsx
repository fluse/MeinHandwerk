import { useState } from 'react'
import { useAuth } from '@/core/auth/AuthProvider'
import { useVehicles } from '../hooks/useVehicles'
import { useDeleteVehicle } from '../hooks/useVehicleMutations'
import { VehicleMap } from '../components/VehicleMap'
import { VehicleCard } from '../components/VehicleCard'
import { AddVehicleForm } from '../components/AddVehicleForm'
import { EditVehicleDialog } from '../components/EditVehicleDialog'
import type { Vehicle } from '../types/vehicle'

export function VehiclesPage() {
  const { user, canPlan } = useAuth()
  const { data: vehicles, isLoading, isError } = useVehicles()
  const deleteVehicle = useDeleteVehicle()
  const [editing, setEditing] = useState<Vehicle | null>(null)

  if (isLoading) {
    return <p className="text-sm text-muted">Fahrzeuge werden geladen…</p>
  }

  if (isError || !vehicles) {
    return <p className="text-sm text-danger">Fahrzeuge konnten nicht geladen werden.</p>
  }

  return (
    <div className="mx-auto max-w-lg pb-16">
      <h1 className="mb-3 text-lg font-bold text-ink">Fahrzeuge</h1>

      {canPlan && <VehicleMap vehicles={vehicles} />}

      {vehicles.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted">
          Noch keine Fahrzeuge. {canPlan ? 'Lege eins an.' : 'Bitte Chef/Büro fragen.'}
        </div>
      ) : (
        vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            currentUserId={user?.id ?? ''}
            canPlan={canPlan}
            onEdit={() => setEditing(v)}
            onDelete={() => deleteVehicle.mutate(v.id)}
          />
        ))
      )}

      {canPlan && <AddVehicleForm />}

      {editing && <EditVehicleDialog vehicle={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
