import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { vehicleFormSchema, type Vehicle, type VehicleFormInput } from '../types/vehicle'
import { useUpdateVehicle } from '../hooks/useVehicleMutations'

interface EditVehicleDialogProps {
  vehicle: Vehicle
  onClose: () => void
}

export function EditVehicleDialog({ vehicle, onClose }: EditVehicleDialogProps) {
  const { mutate, isPending, error } = useUpdateVehicle()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { name: vehicle.name, plate: vehicle.plate, notes: vehicle.notes },
  })

  const onSubmit = (input: VehicleFormInput) => {
    mutate({ id: vehicle.id, input }, { onSuccess: onClose })
  }

  return (
    <Overlay onSubmit={handleSubmit(onSubmit)}>
      <label className="mb-1 block text-xs font-medium text-muted" htmlFor="name">
        Name
      </label>
      <input
        id="name"
        className="mb-1 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink focus:border-sage focus:outline-none"
        {...register('name')}
      />
      <p className="mb-2 text-xs text-danger">{errors.name?.message ?? ' '}</p>

      <label className="mb-1 block text-xs font-medium text-muted" htmlFor="plate">
        Kennzeichen
      </label>
      <input
        id="plate"
        className="mb-3 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('plate')}
      />

      <label className="mb-1 block text-xs font-medium text-muted" htmlFor="notes">
        Notizen
      </label>
      <textarea
        id="notes"
        className="mb-3 min-h-[60px] w-full resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('notes')}
      />

      {error && (
        <p className="mb-2 text-xs text-danger">Änderung konnte nicht gespeichert werden.</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Speichert…' : 'Speichern'}
        </Button>
      </div>
    </Overlay>
  )
}
