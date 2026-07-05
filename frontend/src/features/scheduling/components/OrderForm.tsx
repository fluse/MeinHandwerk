import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Plus } from 'lucide-react'
import { ROLE_VALUES, ROLES } from '@/core/lib/roles'
import { Button } from '@/core/components/Button'
import type { RosterMember } from '@/core/api/roster'
import { useCreateOrder, useUpdateOrder } from '../hooks/useOrderMutations'
import { useCustomerLookup } from '../hooks/useCustomerLookup'
import { orderFormSchema, TRADE_VALUES, TRADES, type OrderFormInput } from '../types/order'
import { TradeDot } from './TradeBadge'

const fieldClass =
  'w-full rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'

interface OrderFormProps {
  orderId?: string
  defaultValues: OrderFormInput
  roster: RosterMember[]
  onDone: () => void
  onCancel: () => void
}

export function OrderForm({ orderId, defaultValues, roster, onDone, onCancel }: OrderFormProps) {
  const create = useCreateOrder()
  const update = useUpdateOrder()
  const { data: customers = [] } = useCustomerLookup()
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<OrderFormInput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })

  const { onChange: onClientChange, ...clientField } = register('client')

  const grouped = ROLE_VALUES.map((role) => ({
    role,
    members: roster.filter((m) => m.role === role),
  })).filter((g) => g.members.length)

  const onSubmit = (input: OrderFormInput) => {
    if (orderId) {
      update.mutate({ id: orderId, input }, { onSuccess: onDone })
    } else {
      create.mutate(input, { onSuccess: onDone })
    }
  }

  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg pb-10">
      <input type="hidden" {...register('project')} />
      <div className="mb-1 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="title">
          Titel *
        </label>
        <input
          id="title"
          className={fieldClass}
          placeholder="z. B. Split-Klima Wohnzimmer"
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
      </div>

      <div className="mb-3 mt-3">
        <div className="mb-1 text-xs font-medium text-muted">Art / Gewerk</div>
        <Controller
          control={control}
          name="trade"
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {TRADE_VALUES.map((trade) => (
                <button
                  key={trade}
                  type="button"
                  onClick={() => field.onChange(trade)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    field.value === trade ? 'border-sage bg-page' : 'border-border'
                  }`}
                >
                  <TradeDot trade={trade} />
                  {TRADES[trade]}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="date">
          Datum
        </label>
        <input id="date" type="date" className={fieldClass} {...register('date')} />
        {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
      </div>

      <div className="mb-3 flex gap-2.5">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="from">
            Von
          </label>
          <input id="from" type="time" className={fieldClass} {...register('from')} />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted" htmlFor="to">
            Bis
          </label>
          <input id="to" type="time" className={fieldClass} {...register('to')} />
        </div>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="client">
          Auftraggeber
        </label>
        <input
          id="client"
          list="customerlist"
          className={fieldClass}
          placeholder="Nachname / Firma"
          {...clientField}
          onChange={(e) => {
            onClientChange(e)
            const match = customers.find((c) => c.label === e.target.value)
            if (match) {
              if (!getValues('phone') && match.phone) setValue('phone', match.phone)
              if (!getValues('address') && match.address) setValue('address', match.address)
            }
          }}
        />
        <datalist id="customerlist">
          {customers.map((c) => (
            <option key={c.id} value={c.label} />
          ))}
        </datalist>
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="phone">
          Telefon
        </label>
        <input
          id="phone"
          type="tel"
          className={fieldClass}
          placeholder="+49 …"
          {...register('phone')}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="address">
          Adresse
        </label>
        <input
          id="address"
          className={fieldClass}
          placeholder="Straße, PLZ Ort"
          {...register('address')}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="material">
          Material
        </label>
        <textarea
          id="material"
          className={`${fieldClass} min-h-[60px] resize-y`}
          placeholder="z. B. Bosch Climate 7000 …"
          {...register('material')}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="desc">
          Leistungsbeschreibung
        </label>
        <textarea
          id="desc"
          className={`${fieldClass} min-h-[90px] resize-y`}
          {...register('desc')}
        />
      </div>

      <div className="mb-3">
        <div className="mb-1 text-xs font-medium text-muted">Mitarbeiter zuteilen</div>
        <Controller
          control={control}
          name="assigned"
          render={({ field }) => (
            <>
              {grouped.map((g) => (
                <div key={g.role} className="mb-2">
                  <div className="mb-1 text-[11px] font-bold text-muted">{ROLES[g.role].label}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.members.map((m) => {
                      const on = field.value.includes(m.id)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            field.onChange(
                              on ? field.value.filter((id) => id !== m.id) : [...field.value, m.id],
                            )
                          }
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                            on ? 'border-sage bg-page text-sage-deep' : 'border-border text-muted'
                          }`}
                        >
                          {on ? <Check size={14} /> : <Plus size={14} />}
                          {m.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div
                className={`mt-1 text-xs font-semibold ${field.value.length ? 'text-sage-deep' : 'text-muted'}`}
              >
                {field.value.length
                  ? `Zugeteilt: ${field.value.length} Mitarbeiter`
                  : 'Noch niemand zugeteilt'}
              </div>
            </>
          )}
        />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="note">
          Notiz (intern)
        </label>
        <textarea
          id="note"
          className={`${fieldClass} min-h-[50px] resize-y`}
          {...register('note')}
        />
      </div>

      <div className="mt-2 flex gap-2.5">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={isPending}>
          {orderId ? 'Speichern' : 'Anlegen'}
        </Button>
      </div>
    </form>
  )
}
