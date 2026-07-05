import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ROLES, ROLE_VALUES } from '@/core/lib/roles'
import { Button } from '@/core/components/Button'
import { editMemberSchema, type EditMemberInput, type TeamMember } from '../types/member'
import { useUpdateMember } from '../hooks/useUpdateMember'

interface EditMemberDialogProps {
  member: TeamMember
  onClose: () => void
}

export function EditMemberDialog({ member, onClose }: EditMemberDialogProps) {
  const { mutate, isPending, error } = useUpdateMember()
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<EditMemberInput>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: { name: member.name, role: member.role, phone: member.phone },
  })

  const onSubmit = (input: EditMemberInput) => {
    mutate({ id: member.id, input }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg bg-card p-5 shadow-xl"
      >
        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className="mb-1 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold text-ink focus:border-sage focus:outline-none"
          {...register('name')}
        />
        <p className="mb-2 text-xs text-danger">{errors.name?.message ?? ' '}</p>

        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ROLE_VALUES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => field.onChange(role)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
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

        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="phone">
          Handynummer
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="für WhatsApp/SMS, z. B. +49 170 …"
          className="mb-3 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none"
          {...register('phone')}
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
      </form>
    </div>
  )
}
