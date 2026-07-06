import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IdCard, MapPin, NotebookPen, Phone } from 'lucide-react'
import { Button } from '@/core/components/Button'
import { FormSection, formFieldClass, formLabelClass } from '@/core/components/FormSection'
import { customerFormSchema, type Customer, type CustomerFormInput } from '../types/customer'
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomerMutations'

const fieldClass = formFieldClass
const labelClass = formLabelClass

interface CustomerFormProps {
  customer?: Customer
  onDone: () => void
  onCancel: () => void
}

export function CustomerForm({ customer, onDone, onCancel }: CustomerFormProps) {
  const create = useCreateCustomer()
  const update = useUpdateCustomer()
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
      <FormSection icon={<IdCard size={16} />} title="Stammdaten">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="kdnr">
            Kd-Nr (aus TAIFUN)
          </label>
          <input id="kdnr" className={fieldClass} placeholder="optional" {...register('kdnr')} />
        </div>

        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="name">
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

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="contact">
            Ansprechpartner
          </label>
          <input
            id="contact"
            className={fieldClass}
            placeholder="z. B. Herr Weber"
            {...register('contact')}
          />
        </div>
      </FormSection>

      <FormSection icon={<MapPin size={16} />} title="Adresse">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="street">
            Straße
          </label>
          <input
            id="street"
            className={fieldClass}
            placeholder="Straße + Nr."
            {...register('street')}
          />
        </div>

        <div className="flex gap-2.5">
          <div className="flex w-[38%] flex-col gap-1">
            <label className={labelClass} htmlFor="zip">
              PLZ
            </label>
            <input id="zip" className={fieldClass} {...register('zip')} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className={labelClass} htmlFor="city">
              Ort
            </label>
            <input id="city" className={fieldClass} {...register('city')} />
          </div>
        </div>
      </FormSection>

      <FormSection icon={<Phone size={16} />} title="Kontakt">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="phone">
            Telefon
          </label>
          <input id="phone" type="tel" className={fieldClass} {...register('phone')} />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="email">
            E-Mail
          </label>
          <input id="email" type="email" className={fieldClass} {...register('email')} />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>
      </FormSection>

      <FormSection icon={<NotebookPen size={16} />} title="Notizen">
        <textarea
          id="notes"
          className={`${fieldClass} min-h-[60px] resize-y`}
          {...register('notes')}
        />
      </FormSection>

      <div className="mt-2 flex gap-2.5 border-t border-border pt-4">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {customer ? 'Speichern' : 'Anlegen'}
        </Button>
      </div>
    </form>
  )
}
