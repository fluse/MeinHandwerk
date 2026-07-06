import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { vehicleFormSchema, type VehicleFormInput } from '../types/vehicle'
import { useCreateVehicle } from '../hooks/useVehicleMutations'

export function AddVehicleForm() {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error } = useCreateVehicle()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VehicleFormInput>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { name: '', plate: '', notes: '' },
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-sage-deep hover:bg-page"
      >
        <Plus size={16} /> Fahrzeug hinzufügen
      </button>
    )
  }

  const onSubmit = (data: VehicleFormInput) => {
    mutate(data, {
      onSuccess: () => {
        reset({ name: '', plate: '', notes: '' })
        setOpen(false)
      },
    })
  }

  return (
    <Overlay onSubmit={handleSubmit(onSubmit)} panelClassName="flex flex-col gap-2">
      <div className="mb-1 text-sm font-extrabold text-sage-deep">Fahrzeug hinzufügen</div>

      <input
        placeholder="Name (z. B. Sprinter 1)"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('name')}
      />
      {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}

      <input
        placeholder="Kennzeichen (optional)"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('plate')}
      />

      <textarea
        placeholder="Notizen (optional)"
        className="min-h-[60px] resize-y rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('notes')}
      />

      {error && <p className="text-xs text-danger">Fahrzeug konnte nicht angelegt werden.</p>}

      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Wird angelegt…' : 'Hinzufügen'}
        </Button>
      </div>
    </Overlay>
  )
}
