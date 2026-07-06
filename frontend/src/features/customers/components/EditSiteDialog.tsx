import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/core/components/Button'
import { Overlay } from '@/core/components/Overlay'
import { siteFormSchema, type Site, type SiteFormInput } from '../types/site'
import { useUpdateSite } from '../hooks/useSiteMutations'

interface EditSiteDialogProps {
  site: Site
  onClose: () => void
}

export function EditSiteDialog({ site, onClose }: EditSiteDialogProps) {
  const { mutate, isPending, error } = useUpdateSite(site.customer)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SiteFormInput>({
    resolver: zodResolver(siteFormSchema),
    defaultValues: {
      label: site.label,
      street: site.street,
      zip: site.zip,
      city: site.city,
      notes: site.notes,
    },
  })

  const onSubmit = (input: SiteFormInput) => {
    mutate({ id: site.id, input }, { onSuccess: onClose })
  }

  return (
    <Overlay onSubmit={handleSubmit(onSubmit)}>
      <label className="mb-1 block text-xs font-medium text-muted" htmlFor="label">
        Bezeichnung
      </label>
      <input
        id="label"
        className="mb-1 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink focus:border-sage focus:outline-none"
        {...register('label')}
      />
      <p className="mb-2 text-xs text-danger">{errors.label?.message ?? ' '}</p>

      <label className="mb-1 block text-xs font-medium text-muted" htmlFor="street">
        Straße
      </label>
      <input
        id="street"
        className="mb-3 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('street')}
      />

      <div className="mb-3 flex gap-2.5">
        <div className="flex w-[38%] flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="zip">
            PLZ
          </label>
          <input
            id="zip"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
            {...register('zip')}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="city">
            Ort
          </label>
          <input
            id="city"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
            {...register('city')}
          />
        </div>
      </div>

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
