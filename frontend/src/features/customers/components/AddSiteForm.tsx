import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { siteFormSchema, type SiteFormInput } from '../types/site'
import { useCreateSite } from '../hooks/useSiteMutations'

const fieldClass =
  'rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

export function AddSiteForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error } = useCreateSite(customerId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SiteFormInput>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: { label: '', street: '', zip: '', city: '', notes: '' },
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-2.5 text-sm font-semibold text-sage-deep hover:bg-page"
      >
        <Plus size={16} /> Baustelle hinzufügen
      </button>
    )
  }

  const onSubmit = (data: SiteFormInput) => {
    mutate(data, {
      onSuccess: () => {
        reset({ label: '', street: '', zip: '', city: '', notes: '' })
        setOpen(false)
      },
    })
  }

  return (
    <Overlay onSubmit={handleSubmit(onSubmit)} panelClassName="flex flex-col gap-2">
      <div className="mb-1 text-sm font-extrabold text-sage-deep">Baustelle hinzufügen</div>

      <input placeholder="Bezeichnung (optional)" className={fieldClass} {...register('label')} />

      <input placeholder="Straße + Nr." className={fieldClass} {...register('street')} />

      <div className="flex gap-2">
        <input placeholder="PLZ" className={`w-[38%] ${fieldClass}`} {...register('zip')} />
        <input placeholder="Ort" className={`flex-1 ${fieldClass}`} {...register('city')} />
      </div>

      <textarea
        placeholder="Notizen (optional)"
        className={`min-h-[50px] resize-y ${fieldClass}`}
        {...register('notes')}
      />

      {errors.label && <p className="text-xs text-danger">{errors.label.message}</p>}
      {error && <p className="text-xs text-danger">Baustelle konnte nicht angelegt werden.</p>}

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
