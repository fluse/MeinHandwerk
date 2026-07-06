import { useState } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Calendar, Check, ClipboardList, FileText, Plus, Trash2, User } from 'lucide-react'
import { ROLE_VALUES, ROLES } from '@/core/lib/roles'
import { Button } from '@/core/components/Button'
import { SearchableSelect } from '@/core/components/SearchableSelect'
import { FormSection, formFieldClass, formLabelClass } from '@/core/components/FormSection'
import type { RosterMember } from '@/core/api/roster'
import { useCustomerLookup } from '@/core/hooks/useCustomerLookup'
import { useCustomerSites } from '@/core/hooks/useCustomerSites'
import { useCreateOrder, useUpdateOrder } from '../hooks/useOrderMutations'
import { useOrderBlockMutations } from '../hooks/useOrderBlockMutations'
import { createOrderBlock } from '../api/orderBlocks'
import {
  orderFormSchema,
  TRADE_VALUES,
  TRADES,
  type OrderBlock,
  type OrderFormInput,
} from '../types/order'
import { TradeIcon } from './TradeBadge'

const fieldClass = formFieldClass
const labelClass = formLabelClass

interface OrderFormProps {
  orderId?: string
  defaultValues: OrderFormInput
  /** Bereits vorhandene Termine des Auftrags (leer bei Neuanlage) – für die Diff-Logik beim
   * Speichern (welcher Block ist neu/geändert/entfernt), siehe `onSubmit`. */
  existingBlocks: OrderBlock[]
  roster: RosterMember[]
  onDone: () => void
  onCancel: () => void
}

export function OrderForm({
  orderId,
  defaultValues,
  existingBlocks,
  roster,
  onDone,
  onCancel,
}: OrderFormProps) {
  const create = useCreateOrder()
  const update = useUpdateOrder()
  const blockMutations = useOrderBlockMutations(orderId ?? '')
  const queryClient = useQueryClient()
  const { data: customers = [] } = useCustomerLookup()
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OrderFormInput>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  })

  const { fields: blockFields, append, remove } = useFieldArray({ control, name: 'blocks' })
  // Parallel zu blockFields: die order_blocks-Id je Termin (null = noch nicht gespeichert),
  // damit onSubmit weiß, ob ein Eintrag neu ist, geändert werden muss oder entfernt wurde.
  const [blockIds, setBlockIds] = useState<Array<string | null>>(() =>
    defaultValues.blocks.map((_, i) => existingBlocks[i]?.id ?? null),
  )
  const appendBlock = () => {
    append({ date: '', from: '', to: '', assigned: [] })
    setBlockIds((ids) => [...ids, null])
  }
  const removeBlock = (index: number) => {
    remove(index)
    setBlockIds((ids) => ids.filter((_, i) => i !== index))
  }

  const customerId = watch('customer')
  const { data: sites = [] } = useCustomerSites(customerId ?? '')

  const customerItems = customers.map((cu) => ({
    id: cu.id,
    label: cu.label,
    subtitle: [cu.address, cu.phone].filter(Boolean).join(' · '),
  }))
  const handleCustomerChange = (id: string) => {
    setValue('customer', id)
    setValue('site', '')
    const match = customers.find((cu) => cu.id === id)
    if (match) {
      if (!getValues('client')) setValue('client', match.label)
      if (!getValues('phone') && match.phone) setValue('phone', match.phone)
      if (!getValues('street') && match.street) {
        setValue('street', match.street)
        setValue('zip', match.zip)
        setValue('city', match.city)
      }
    }
  }

  const siteItems = sites.map((s) => ({ id: s.id, label: s.label, subtitle: s.address }))
  const handleSiteChange = (id: string) => {
    setValue('site', id)
    const match = sites.find((s) => s.id === id)
    if (match) {
      setValue('street', match.street)
      setValue('zip', match.zip)
      setValue('city', match.city)
    }
  }

  const grouped = ROLE_VALUES.map((role) => ({
    role,
    members: roster.filter((m) => m.role === role),
  })).filter((g) => g.members.length)

  const onSubmit = async (input: OrderFormInput) => {
    if (orderId) {
      await update.mutateAsync({ id: orderId, input })
      const currentIds = new Set(blockIds.filter((id): id is string => Boolean(id)))
      const removed = existingBlocks.filter((b) => !currentIds.has(b.id))
      await Promise.all([
        ...removed.map((b) => blockMutations.remove.mutateAsync(b.id)),
        ...input.blocks.map((block, index) => {
          const blockId = blockIds[index]
          return blockId
            ? blockMutations.update.mutateAsync({ id: blockId, input: block })
            : blockMutations.create.mutateAsync(block)
        }),
      ])
    } else {
      const order = await create.mutateAsync(input)
      await Promise.all(input.blocks.map((block) => createOrderBlock(order.id, block)))
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
    onDone()
  }

  const isPending = create.isPending || update.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg pb-10">
      <input type="hidden" {...register('project')} />

      <FormSection icon={<ClipboardList size={16} />} title="Grunddaten">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="title">
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

        <div>
          <div className={`mb-1.5 ${labelClass}`}>Art / Gewerk</div>
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
                      field.value === trade
                        ? 'border-sage bg-sage/10 text-sage-deep'
                        : 'border-border text-muted'
                    }`}
                  >
                    <TradeIcon trade={trade} />
                    {TRADES[trade]}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      </FormSection>

      <FormSection icon={<Calendar size={16} />} title="Termine & Team">
        {blockFields.map((field, index) => (
          <div key={field.id} className="mb-3 rounded-lg border border-border bg-page p-3.5">
            {blockFields.length > 1 && (
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
                  Termin {index + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  aria-label="Termin entfernen"
                  className="text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}

            <div className="mb-2.5 flex flex-col gap-1">
              <label className={labelClass} htmlFor={`blocks.${index}.date`}>
                Datum
              </label>
              <input
                id={`blocks.${index}.date`}
                type="date"
                className={fieldClass}
                {...register(`blocks.${index}.date`)}
              />
              {errors.blocks?.[index]?.date && (
                <p className="text-xs text-danger">{errors.blocks[index]?.date?.message}</p>
              )}
            </div>

            <div className="mb-3 flex gap-2.5">
              <div className="flex flex-1 flex-col gap-1">
                <label className={labelClass} htmlFor={`blocks.${index}.from`}>
                  Von
                </label>
                <input
                  id={`blocks.${index}.from`}
                  type="time"
                  className={fieldClass}
                  {...register(`blocks.${index}.from`)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className={labelClass} htmlFor={`blocks.${index}.to`}>
                  Bis
                </label>
                <input
                  id={`blocks.${index}.to`}
                  type="time"
                  className={fieldClass}
                  {...register(`blocks.${index}.to`)}
                />
              </div>
            </div>

            <div>
              <div className={`mb-1.5 ${labelClass}`}>Mitarbeiter zuteilen</div>
              <Controller
                control={control}
                name={`blocks.${index}.assigned`}
                render={({ field: assignedField }) => (
                  <>
                    {grouped.map((g) => (
                      <div key={g.role} className="mb-2">
                        <div className="mb-1 text-[11px] font-bold text-muted">
                          {ROLES[g.role].label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {g.members.map((m) => {
                            const on = assignedField.value.includes(m.id)
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() =>
                                  assignedField.onChange(
                                    on
                                      ? assignedField.value.filter((id) => id !== m.id)
                                      : [...assignedField.value, m.id],
                                  )
                                }
                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                  on
                                    ? 'border-sage bg-card text-sage-deep'
                                    : 'border-border bg-card text-muted'
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
                      className={`mt-1 text-xs font-semibold ${assignedField.value.length ? 'text-sage-deep' : 'text-muted'}`}
                    >
                      {assignedField.value.length
                        ? `Zugeteilt: ${assignedField.value.length} Mitarbeiter`
                        : 'Noch niemand zugeteilt'}
                    </div>
                  </>
                )}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={appendBlock}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-sage-deep"
        >
          <Plus size={12} /> Weiteren Termin hinzufügen
        </button>
      </FormSection>

      <FormSection icon={<User size={16} />} title="Kunde & Kontakt">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="customer">
            Kunde (optional)
          </label>
          <SearchableSelect
            id="customer"
            value={customerId ?? ''}
            onChange={handleCustomerChange}
            items={customerItems}
            emptyOptionLabel="— Kein Kunde / Freitext —"
            searchPlaceholder="Name, Ort, Telefon…"
          />
        </div>

        {customerId && (
          <div className="mb-4 flex flex-col gap-1">
            <label className={labelClass} htmlFor="site">
              Baustelle (optional)
            </label>
            <SearchableSelect
              id="site"
              value={watch('site') ?? ''}
              onChange={handleSiteChange}
              items={siteItems}
              emptyOptionLabel="— Kundenadresse verwenden —"
              searchPlaceholder="Bezeichnung, Ort…"
            />
          </div>
        )}

        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="client">
            Auftraggeber
          </label>
          <input
            id="client"
            className={fieldClass}
            placeholder="Nachname / Firma"
            {...register('client')}
          />
        </div>

        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="phone">
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

      <FormSection icon={<FileText size={16} />} title="Details">
        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="material">
            Material
          </label>
          <textarea
            id="material"
            className={`${fieldClass} min-h-[60px] resize-y`}
            placeholder="z. B. Bosch Climate 7000 …"
            {...register('material')}
          />
        </div>

        <div className="mb-4 flex flex-col gap-1">
          <label className={labelClass} htmlFor="desc">
            Leistungsbeschreibung
          </label>
          <textarea
            id="desc"
            className={`${fieldClass} min-h-[90px] resize-y`}
            {...register('desc')}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="note">
            Notiz (intern)
          </label>
          <textarea
            id="note"
            className={`${fieldClass} min-h-[50px] resize-y`}
            {...register('note')}
          />
        </div>
      </FormSection>

      <div className="mt-2 flex gap-2.5 border-t border-border pt-4">
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
