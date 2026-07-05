import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { ROLES, ROLE_VALUES } from '@/core/lib/roles'
import { Button } from '@/core/components/Button'
import { createMemberSchema, type CreateMemberInput } from '../types/member'
import { useCreateMember } from '../hooks/useCreateMember'

export function AddMemberForm() {
  const [open, setOpen] = useState(false)
  const { mutate, isPending, error } = useCreateMember()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { role: 'monteur' },
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed cursor-pointer border-border py-3 text-sm font-semibold text-sage-deep hover:bg-page"
      >
        <Plus size={16} /> Mitarbeiter hinzufügen
      </button>
    )
  }

  const onSubmit = (data: CreateMemberInput) => {
    mutate(data, {
      onSuccess: () => {
        reset({ role: 'monteur', name: '', email: '', password: '', phone: '' })
        setOpen(false)
      },
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-1.5 flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5"
    >
      <div className="mb-1 text-sm font-extrabold text-sage-deep">Mitarbeiter hinzufügen</div>

      <input
        placeholder="Name"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('name')}
      />
      {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}

      <input
        type="email"
        placeholder="E-Mail"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('email')}
      />
      {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}

      <input
        type="password"
        placeholder="Passwort (mind. 8 Zeichen)"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('password')}
      />
      {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}

      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <div className="flex flex-wrap gap-1.5">
            {ROLE_VALUES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => field.onChange(role)}
                className={`rounded-full border cursor-pointer px-3 py-1.5 text-xs font-semibold ${
                  field.value === role
                    ? 'border-sage bg-page text-sage-deep'
                    : 'border-border text-muted'
                }`}
              >
                {ROLES[role].label}
              </button>
            ))}
          </div>
        )}
      />

      <input
        type="tel"
        placeholder="Handynummer (für WhatsApp/SMS, optional)"
        className="rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
        {...register('phone')}
      />

      {error && <p className="text-xs text-danger">Mitarbeiter konnte nicht angelegt werden.</p>}

      <div className="mt-1 flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Wird angelegt…' : 'Hinzufügen'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}
