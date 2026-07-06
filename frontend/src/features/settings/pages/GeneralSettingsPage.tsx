import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image as ImageIcon } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { InstallAppSection } from '@/core/components/InstallAppSection'
import { useCompanySettings } from '../hooks/useCompanySettings'
import { useUpdateCompanySettings } from '../hooks/useUpdateCompanySettings'
import {
  companySettingsFormSchema,
  type CompanySettings,
  type CompanySettingsFormInput,
} from '../types/companySettings'

function GeneralSettingsForm({ settings }: { settings: CompanySettings }) {
  const { mutate, isPending, error } = useUpdateCompanySettings()
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanySettingsFormInput>({
    resolver: zodResolver(companySettingsFormSchema),
    defaultValues: {
      companyName: settings.companyName,
      street: settings.street,
      zip: settings.zip,
      city: settings.city,
    },
  })

  const pickLogo = (file: File | null) => {
    setLogo(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const onSubmit = (input: CompanySettingsFormInput) => {
    mutate({ id: settings.id, input: { ...input, logo: logo ?? undefined } })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Logo</label>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-xl border border-border bg-page">
            {preview || settings.logoUrl ? (
              <img
                src={preview ?? settings.logoUrl}
                alt="Firmenlogo"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon size={22} className="text-muted" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted hover:bg-page"
          >
            Logo auswählen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="companyName">
          Firmenname
        </label>
        <input
          id="companyName"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
          {...register('companyName')}
        />
        <p className="mt-1 text-xs text-danger">{errors.companyName?.message ?? ' '}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="street">
          Straße und Hausnummer
        </label>
        <input
          id="street"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
          {...register('street')}
        />
      </div>

      <div className="flex gap-3">
        <div className="w-28 flex-none">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="zip">
            PLZ
          </label>
          <input
            id="zip"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
            {...register('zip')}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted" htmlFor="city">
            Ort
          </label>
          <input
            id="city"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
            {...register('city')}
          />
        </div>
      </div>

      {error && <p className="text-xs text-danger">Änderungen konnten nicht gespeichert werden.</p>}

      <div className="mt-1 flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Wird gespeichert…' : 'Speichern'}
        </Button>
      </div>
    </form>
  )
}

export function GeneralSettingsPage() {
  const { data: settings, isLoading, isError } = useCompanySettings()

  if (isLoading) {
    return <p className="text-sm text-muted">Einstellungen werden geladen…</p>
  }

  if (isError || !settings) {
    return <p className="text-sm text-danger">Einstellungen konnten nicht geladen werden.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <GeneralSettingsForm key={settings.id} settings={settings} />
      <InstallAppSection />
    </div>
  )
}
