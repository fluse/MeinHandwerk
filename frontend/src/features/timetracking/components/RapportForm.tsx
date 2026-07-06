import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, X } from 'lucide-react'
import { useAuth } from '@/core/auth/AuthProvider'
import { Button } from '@/core/components/Button'
import { SignaturePad } from '@/core/components/SignaturePad'
import { todayISO } from '@/core/lib/date'
import { useCreateRapport, useUpdateRapport } from '../hooks/useRapportMutations'
import { useRapportMaterialMutations } from '../hooks/useRapportMaterialMutations'
import {
  rapportFormSchema,
  type MaterialLine,
  type Rapport,
  type RapportFormInput,
  type RapportMaterial,
} from '../types/rapport'

const fieldClass =
  'rounded-md border border-border px-3 py-2 text-sm focus:border-sage focus:outline-none'
const UNITS = ['Stk', 'm', 'lfm', 'm²', 'kg', 'l', 'h', 'Pausch.']

function newLine(): MaterialLine {
  return { id: crypto.randomUUID(), isNew: true, qty: '', unit: 'Stk', desc: '' }
}

interface RapportFormProps {
  orderId: string
  rapport?: Rapport
  defaultSignedName?: string
  initialMaterials: RapportMaterial[]
  onDone: () => void
  onCancel: () => void
}

export function RapportForm({
  orderId,
  rapport,
  defaultSignedName = '',
  initialMaterials,
  onDone,
  onCancel,
}: RapportFormProps) {
  const { user } = useAuth()
  const createRapport = useCreateRapport(orderId)
  const updateRapport = useUpdateRapport(orderId)
  const materialMutations = useRapportMaterialMutations(rapport?.id ?? '')

  const [materials, setMaterials] = useState<MaterialLine[]>(
    initialMaterials.length
      ? initialMaterials.map((m) => ({
          id: m.id,
          isNew: false,
          qty: m.qty,
          unit: m.unit,
          desc: m.desc,
        }))
      : [newLine()],
  )
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [signatureDataUrl, setSignatureDataUrl] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RapportFormInput>({
    resolver: zodResolver(rapportFormSchema),
    defaultValues: rapport
      ? { date: rapport.date, text: rapport.text, signedName: rapport.signedName }
      : { date: todayISO(), text: '', signedName: defaultSignedName },
  })

  const setLine = (id: string, patch: Partial<MaterialLine>) =>
    setMaterials((lines) => lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))

  const removeLine = (line: MaterialLine) => {
    setMaterials((lines) => lines.filter((l) => l.id !== line.id))
    if (!line.isNew) setRemovedIds((ids) => [...ids, line.id])
  }

  const onSubmit = async (values: RapportFormInput) => {
    setError('')
    setSaving(true)
    try {
      let rapportId = rapport?.id
      const authorId = rapport?.author ?? user?.id ?? ''
      if (rapportId) {
        await updateRapport.mutateAsync({
          id: rapportId,
          input: { ...values, orderId, authorId, signatureDataUrl: signatureDataUrl || undefined },
        })
      } else {
        const created = await createRapport.mutateAsync({
          ...values,
          orderId,
          authorId,
          signatureDataUrl: signatureDataUrl || undefined,
        })
        rapportId = created.id
      }

      await Promise.all(removedIds.map((id) => materialMutations.remove.mutateAsync(id)))
      await Promise.all(
        materials.map((line) => {
          const hasContent = line.desc.trim() || line.qty.trim()
          if (!hasContent) {
            return line.isNew ? Promise.resolve() : materialMutations.remove.mutateAsync(line.id)
          }
          if (line.isNew) {
            return materialMutations.create.mutateAsync({
              qty: line.qty,
              unit: line.unit,
              desc: line.desc,
            })
          }
          return materialMutations.update.mutateAsync({
            id: line.id,
            qty: line.qty,
            unit: line.unit,
            desc: line.desc,
          })
        }),
      )
      onDone()
    } catch {
      setError('Rapport konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-lg pb-10">
      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="date">
          Datum
        </label>
        <input id="date" type="date" className={`${fieldClass} w-full`} {...register('date')} />
        {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="text">
          Ausgeführte Arbeiten *
        </label>
        <textarea
          id="text"
          className={`${fieldClass} w-full min-h-[100px] resize-y`}
          placeholder="Was wurde gemacht?"
          {...register('text')}
        />
        {errors.text && <p className="text-xs text-danger">{errors.text.message}</p>}
      </div>

      <div className="mb-2 text-sm font-extrabold text-sage-deep">Material</div>
      <div className="mb-1 flex gap-1.5 px-0.5 text-[11px] font-bold text-muted">
        <div className="w-14">Menge</div>
        <div className="w-16">Einheit</div>
        <div className="flex-1">Bezeichnung</div>
        <div className="w-5" />
      </div>
      {materials.map((line) => (
        <div key={line.id} className="mb-1.5 flex items-center gap-1.5">
          <input
            value={line.qty}
            onChange={(e) => setLine(line.id, { qty: e.target.value })}
            inputMode="decimal"
            placeholder="0"
            className={`${fieldClass} w-14 px-2 py-2 text-center`}
          />
          <input
            list="unitlist"
            value={line.unit}
            onChange={(e) => setLine(line.id, { unit: e.target.value })}
            className={`${fieldClass} w-16 px-2 py-2`}
          />
          <input
            value={line.desc}
            onChange={(e) => setLine(line.id, { desc: e.target.value })}
            placeholder="z. B. Kupferrohr 15 mm"
            className={`${fieldClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => removeLine(line)}
            className="flex w-5 items-center justify-center text-danger"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <datalist id="unitlist">
        {UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <button
        type="button"
        onClick={() => setMaterials((lines) => [...lines, newLine()])}
        className="mt-0.5 flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted"
      >
        <Plus size={12} /> Materialzeile
      </button>

      <div className="mb-2 mt-5 text-sm font-extrabold text-sage-deep">Kundenunterschrift</div>
      {rapport?.signatureUrl && !signatureDataUrl && (
        <img
          src={rapport.signatureUrl}
          alt="Bisherige Unterschrift"
          className="mb-2 max-h-28 rounded-lg border border-border bg-card"
        />
      )}
      <SignaturePad onChange={setSignatureDataUrl} />

      <div className="mt-3 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted" htmlFor="signedName">
          Name des Unterzeichners
        </label>
        <div className="relative">
          <input
            id="signedName"
            className={`${fieldClass} w-full pr-9`}
            placeholder="z. B. Herr Weber"
            {...register('signedName')}
          />
          {watch('signedName') && (
            <button
              type="button"
              onClick={() => setValue('signedName', '', { shouldDirty: true })}
              aria-label="Name löschen"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-4 flex gap-2.5">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" className="flex-1" disabled={saving}>
          Rapport speichern
        </Button>
      </div>
    </form>
  )
}
