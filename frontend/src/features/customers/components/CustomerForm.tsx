import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/core/components/Button'
import { ConfirmDialog } from '@/core/components/ConfirmDialog'
import { useState } from 'react'
import { customerFormSchema, type Customer, type CustomerFormInput } from '../types/customer'
import {
  useCreateCustomer,
  useDeleteCustomer,
  useUpdateCustomer,
} from '../hooks/useCustomerMutations'

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

interface CustomerFormProps {
  customer?: Customer
  onDone: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onDone, onCancel }: CustomerFormProps) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
  const del = useDeleteCustomer()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ?? {
      kdnr: '',
      name: '',
      contact: '',
      street: '',
      zip: '',
      city: '',
      phone: '',
      email: '',
      notes: '',
    },
  })

  const onSubmit = (input: CustomerFormInput) => {
    if (customer) {
      update.mutate({ id: customer.id, input }, { onSuccess: onDone })
    } else {
      create.mutate(input, { onSuccess: onDone })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg pb-10">
      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="kdnr">
          Kd-Nr (aus TAIFUN)
        </label>
        <input id="kdnr" className={fieldClass} placeholder="optional" {...register('kdnr')} />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="name">
          Name / Firma
        </label>
        <input
          id="name"
          className={fieldClass}
          placeholder="z. B. Weber GmbH"
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="contact">
          Ansprechpartner
        </label>
        <input
          id="contact"
          className={fieldClass}
          placeholder="z. B. Herr Weber"
          {...register('contact')}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="street">
          Straße
        </label>
        <input
          id="street"
          className={fieldClass}
          placeholder="Straße + Nr."
          {...register('street')}
        />
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex w-[38%] flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="zip">
            PLZ
          </label>
          <input id="zip" className={fieldClass} {...register('zip')} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="city">
            Ort
          </label>
          <input id="city" className={fieldClass} {...register('city')} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="phone">
          Telefon
        </label>
        <input id="phone" type="tel" className={fieldClass} {...register('phone')} />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="email">
          E-Mail
        </label>
        <input id="email" type="email" className={fieldClass} {...register('email')} />
        {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="notes">
          Notizen
        </label>
        <textarea
          id="notes"
          className={`${fieldClass} min-h-[60px] resize-y`}
          {...register('notes')}
        />
      </div>

      <div className="mt-2 flex gap-2.5">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {customer ? 'Speichern' : 'Anlegen'}
        </Button>
      </div>

      {customer && (
        <Button
          type="button"
          variant="danger"
          className="mt-2.5 w-full"
          onClick={() => setConfirmDelete(true)}
        >
          Kunde löschen
        </Button>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Kunde löschen?"
        description="Dieser Vorgang kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (customer) del.mutate(customer.id, { onSuccess: onDone })
          setConfirmDelete(false)
        }}
      />
    </form>
  )
}
